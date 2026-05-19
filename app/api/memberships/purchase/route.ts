import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createSquarePaymentLink, squareConfigured } from "@/lib/square";

export async function POST(req: NextRequest) {
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) {
    return NextResponse.json({ error: "Sign in required to subscribe." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { plan_id } = body ?? {};
  if (!plan_id) return NextResponse.json({ error: "plan_id is required." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 500 });

  const { data: plan, error: planErr } = await supabase
    .from("membership_plans")
    .select("id, name, price_cents, price_monthly")
    .eq("id", plan_id)
    .single();

  if (planErr || !plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const amountCents = plan.price_cents ?? Math.round(Number(plan.price_monthly || 0) * 100);
  if (!amountCents) return NextResponse.json({ error: "Plan has no price configured." }, { status: 400 });

  if (!squareConfigured()) {
    return NextResponse.json({ error: "Online purchase is not available right now. Please contact us directly." }, { status: 503 });
  }

  const paymentNote = `membership:${plan_id}:${userData.user.id}`;
  const idempotencyKey = `membership-${userData.user.id}-${plan_id}-${Date.now()}`;

  try {
    const link = await createSquarePaymentLink({
      idempotencyKey,
      name: `${String(plan.name)} Membership — Lillyan's Beauty Studio`,
      amountCents,
      clientEmail: userData.user.email,
      redirectPath: "/account?membership=active",
      paymentNote,
    });
    return NextResponse.json({ ok: true, url: link.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not create payment link.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
