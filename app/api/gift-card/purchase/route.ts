import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSquarePaymentLink, squareConfigured } from "@/lib/square";

const ALLOWED_AMOUNTS = [2500, 5000, 7500, 10000, 15000]; // cents: $25, $50, $75, $100, $150

export async function POST(req: NextRequest) {
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) {
    return NextResponse.json({ error: "Sign in required to purchase a gift card." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { amount_cents, recipient_email, recipient_name } = body ?? {};

  if (!amount_cents || !ALLOWED_AMOUNTS.includes(Number(amount_cents))) {
    return NextResponse.json({ error: "Invalid gift card amount." }, { status: 400 });
  }

  const recipientEmail = (recipient_email || userData.user.email).trim().toLowerCase();

  if (!squareConfigured()) {
    return NextResponse.json({ error: "Online purchase is not available right now. Please contact us directly." }, { status: 503 });
  }

  const idempotencyKey = `gc-${userData.user.id}-${Date.now()}`;
  const dollars = (Number(amount_cents) / 100).toFixed(0);
  const paymentNote = `gift_card:${recipientEmail}:${amount_cents}:${recipient_name || ""}`;

  try {
    const link = await createSquarePaymentLink({
      idempotencyKey,
      name: `$${dollars} Gift Card — Lillyan's Beauty Studio`,
      amountCents: Number(amount_cents),
      clientEmail: userData.user.email,
      redirectPath: "/account?gift_card=purchased",
      paymentNote,
    });
    return NextResponse.json({ ok: true, url: link.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not create payment link.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
