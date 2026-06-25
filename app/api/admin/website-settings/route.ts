import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const TEXT_FIELDS = [
  "business_name", "contact_email", "contact_phone", "service_area", "wedding_travel_policy",
  "instagram_url", "facebook_url", "tiktok_url", "footer_text",
  "booking_policy", "cancellation_policy", "deposit_policy",
];

// Persists website/business settings to the single business_settings row.
export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  for (const f of TEXT_FIELDS) if (f in body) update[f] = String(body[f] ?? "").trim() || null;

  const { error } = await supabase.from("business_settings").upsert(update);
  if (error) {
    console.error("[api/admin/website-settings] save failed:", error);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
