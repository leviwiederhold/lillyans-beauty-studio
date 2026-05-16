import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { findMembershipPlan } from "@/lib/membership-plans";

const checkoutSchema = z.object({
  plan_id: z.string().trim().min(1)
});

export async function POST(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!data.user?.email) return NextResponse.json({ error: "Please sign in before joining a membership." }, { status: 401 });

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 });

  const plan = findMembershipPlan(parsed.data.plan_id);
  if (!plan) return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const email = data.user.email.toLowerCase();
  const existingClient = await supabase
    .from("clients")
    .select("id,first_name,last_name,email")
    .or(`profile_id.eq.${data.user.id},email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  const client = existingClient.data
    ? existingClient
    : await supabase.from("clients").insert({ profile_id: data.user.id, email }).select("id,first_name,last_name,email").single();

  if (client.error || !client.data) {
    return NextResponse.json({ error: client.error?.message || "Could not prepare your membership account." }, { status: 500 });
  }

  await supabase.from("memberships").insert({
    client_id: client.data.id,
    client_name: [client.data.first_name, client.data.last_name].filter(Boolean).join(" ") || null,
    email,
    name: plan.name,
    plan_name: plan.name,
    plan_id: plan.id,
    price_label: `${plan.priceLabel}/month`,
    monthly_price_cents: plan.priceCents,
    benefits: plan.perks,
    perks: plan.perks.join("\n"),
    status: "checkout_pending",
    payment_status: "pending",
    is_featured: Boolean(plan.tag),
    is_active: false
  });

  return NextResponse.json(
    { error: "Online membership checkout is being connected. Your membership will not activate until Square payment is available and completed." },
    { status: 503 }
  );
}
