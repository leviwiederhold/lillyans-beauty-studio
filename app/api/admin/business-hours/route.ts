import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const hoursSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  opens_at: z.string().trim().optional().default(""),
  closes_at: z.string().trim().optional().default(""),
  is_closed: z.coerce.boolean().default(false)
});

export async function POST(request: Request) {
  const { user } = await requireAdmin();
  const parsed = hoursSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid business hours." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const data = parsed.data;
  if (!data.is_closed && (!data.opens_at || !data.closes_at)) {
    return NextResponse.json({ error: "Open days need both opening and closing times." }, { status: 400 });
  }

  const before = await supabase.from("business_hours").select("*").eq("day_of_week", data.day_of_week).maybeSingle();
  const payload = {
    day_of_week: data.day_of_week,
    is_closed: data.is_closed,
    opens_at: data.is_closed ? null : data.opens_at,
    closes_at: data.is_closed ? null : data.closes_at,
    updated_at: new Date().toISOString()
  };
  const { data: hours, error } = await supabase.from("business_hours").upsert(payload, { onConflict: "day_of_week" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: "business_hours.update",
    table_name: "business_hours",
    record_id: hours.id,
    before_data: before.data,
    after_data: hours
  });

  return NextResponse.json({ ok: true, hours });
}
