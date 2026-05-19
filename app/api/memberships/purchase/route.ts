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
    .from("memberships")
    .select("id, name, plan_name, price_cents, price_label")
    .eq("id", plan_id)
    .eq("status", "plan")
    .single();

  if (planErr || !plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  // price_cents is the canonical source; fall back to parsing price_label ("$130/mo" → 13000)
  const labelCents = plan.price_label
    ? Math.round(parseFloat(String(plan.price_label).replace(/[^0-9.]/g, "")) * 100)
    : 0;
  const amountCents = (plan.price_cents as number | null) ?? labelCents;
  if (!amountCents) return NextResponse.json({ error: "Plan has no price configured." }, { status: 400 });

  if (!squareConfigured()) {
    return NextResponse.json({ error: "Online purchase is not available right now. Please contact us directly." }, { status: 503 });
  }

  const paymentNote = `membership:${plan_id}:${userData.user.id}`;
  const idempotencyKey = `membership-${userData.user.id}-${plan_id}-${Date.now()}`;

  try {
    const planDisplayName = String((plan.name as string | null) ?? (plan.plan_name as string | null) ?? "Membership");
    const link = await createSquarePaymentLink({
      idempotencyKey,
      name: `${planDisplayName} Membership — Lillyan's Beauty Studio`,
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
