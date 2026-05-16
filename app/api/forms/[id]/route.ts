import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 500 });

  const { error } = await supabase
    .from("client_forms")
    .update({ reviewed: true, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
