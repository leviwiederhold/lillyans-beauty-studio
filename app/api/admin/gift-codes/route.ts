import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { audit } from "@/lib/logging";

export async function PATCH(request: Request) {
  const { user } = await requireAdmin();
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "Gift code id is required." }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const before = await supabase.from("gift_card_codes").select("*").eq("id", id).single();
  const { data, error } = await supabase.from("gift_card_codes").update(updates).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(user.id, "gift_code.update", "gift_card_codes", id, before.data, data);
  return NextResponse.json({ ok: true, code: data });
}
