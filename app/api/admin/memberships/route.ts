import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "checkout_pending", "cancelled", "inactive", "past_due"]).optional(),
  is_active: z.coerce.boolean().optional(),
  payment_status: z.string().trim().optional(),
  cancelled_at: z.string().trim().optional()
});

export async function PATCH(request: Request) {
  const { user } = await requireAdmin();
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid membership update." }, { status: 400 });
  const { id, ...updates } = parsed.data;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const before = await supabase.from("memberships").select("*").eq("id", id).maybeSingle();
  const { data, error } = await supabase
    .from("memberships")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: "membership.update",
    table_name: "memberships",
    record_id: id,
    before_data: before.data,
    after_data: data
  });

  return NextResponse.json({ ok: true, membership: data });
}
