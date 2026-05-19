import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { data, error } = await supabase
    .from("business_hour_overrides")
    .select("*")
    .order("override_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ overrides: data });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const body = await req.json();
  const { override_date, opens_at, closes_at, is_closed, reason } = body;
  if (!override_date) return NextResponse.json({ error: "override_date is required" }, { status: 400 });
  const { data, error } = await supabase
    .from("business_hour_overrides")
    .upsert({
      override_date,
      opens_at: is_closed ? null : opens_at || null,
      closes_at: is_closed ? null : closes_at || null,
      is_closed: !!is_closed,
      reason: reason || null,
    }, { onConflict: "override_date" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, override: data });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabase.from("business_hour_overrides").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
