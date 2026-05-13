import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { adminClientSchema, mergeClientsSchema } from "@/lib/validation";
import { audit } from "@/lib/logging";

export async function POST(request: Request) {
  const { user } = await requireAdmin();
  const parsed = adminClientSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data, error } = await supabase.from("clients").insert(parsed.data).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(user.id, "client.create", "clients", data.id, null, data);
  return NextResponse.json({ ok: true, client: data });
}

export async function PATCH(request: Request) {
  const { user } = await requireAdmin();
  const parsed = mergeClientsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { primary_client_id, duplicate_client_id } = parsed.data;
  const before = await supabase.from("clients").select("*").in("id", [primary_client_id, duplicate_client_id]);
  await Promise.all([
    supabase.from("bookings").update({ client_id: primary_client_id }).eq("client_id", duplicate_client_id),
    supabase.from("intake_forms").update({ client_id: primary_client_id }).eq("client_id", duplicate_client_id),
    supabase.from("memberships").update({ client_id: primary_client_id }).eq("client_id", duplicate_client_id),
    supabase.from("gift_card_code_redemptions").update({ client_id: primary_client_id }).eq("client_id", duplicate_client_id)
  ]);
  const { error } = await supabase.from("clients").delete().eq("id", duplicate_client_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(user.id, "client.merge", "clients", primary_client_id, before.data, { primary_client_id, duplicate_client_id });
  return NextResponse.json({ ok: true });
}
