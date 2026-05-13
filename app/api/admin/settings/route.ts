import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { businessSettingsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = businessSettingsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const jsonOrDefault = (value: string | undefined, fallback: unknown) => {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch { return fallback; }
  };
  const payload = {
    ...parsed.data,
    blocked_dates: jsonOrDefault(parsed.data.blocked_dates, []),
    service_durations: jsonOrDefault(parsed.data.service_durations, {}),
    deposit_amounts: jsonOrDefault(parsed.data.deposit_amounts, {}),
    updated_at: new Date().toISOString()
  };
  const { data: before } = await supabase.from("business_settings").select("*").eq("id", 1).maybeSingle();
  const { error } = await supabase.from("business_settings").upsert({ id: 1, ...payload });
  await supabase.from("admin_audit_log").insert({
    action: "settings.update",
    table_name: "business_settings",
    record_id: null,
    before_data: before,
    after_data: payload
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
