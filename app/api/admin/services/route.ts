import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Toggle/update a service. Affects client booking availability + deposit calc,
// since the booking flow reads services.is_active / requires_deposit / etc.
export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["name", "description", "service_total", "duration_minutes", "requires_deposit", "requires_intake", "intake_type", "is_active", "category_id"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (k in body) update[k] = body[k];

  const { error } = await supabase.from("services").update(update).eq("id", body.id);
  if (error) {
    console.error("[api/admin/services] update failed:", error);
    return NextResponse.json({ error: "Could not update service." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
