import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const auth = await createSupabaseServerClient();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await auth.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { data: profile } = await supabase.from("profiles").select("is_admin,role").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_admin && profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.starts_at || !body?.ends_at) return NextResponse.json({ error: "starts_at and ends_at required" }, { status: 400 });

  const { error } = await supabase.from("blocked_times").insert({
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    reason: body.reason || null
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
