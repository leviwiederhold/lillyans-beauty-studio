import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { data, error } = await supabase
    .from("blocked_times")
    .select("*")
    .order("starts_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocked: data });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const body = await req.json();
  const { starts_at, ends_at, reason, force } = body;
  if (!starts_at || !ends_at) return NextResponse.json({ error: "starts_at and ends_at are required" }, { status: 400 });

  // Check for conflicting bookings unless admin confirms with force=true
  if (!force) {
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("id, client_name, service_type, starts_at")
      .in("status", ["confirmed", "pending"])
      .lt("starts_at", ends_at)
      .gt("ends_at", starts_at);
    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ requiresConfirmation: true, conflicts }, { status: 200 });
    }
  }

  const { data, error } = await supabase
    .from("blocked_times")
    .insert({ starts_at, ends_at, reason: reason || null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, blocked: data });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabase.from("blocked_times").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
