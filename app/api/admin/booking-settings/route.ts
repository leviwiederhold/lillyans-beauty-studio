import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Persists the admin-configurable booking rules that the client booking flow
// reads: minimum notice hours and intake freshness window.
export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const notice = Number(body.booking_minimum_notice_hours);
  const months = Number(body.intake_expiration_months);
  const update: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  if (Number.isFinite(notice) && notice >= 0 && notice <= 720) update.booking_minimum_notice_hours = Math.round(notice);
  if (Number.isFinite(months) && months >= 0 && months <= 60) update.intake_expiration_months = Math.round(months);

  const { error } = await supabase.from("business_settings").upsert(update);
  if (error) {
    console.error("[api/admin/booking-settings] save failed:", error);
    return NextResponse.json({ error: "Could not save booking settings." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
