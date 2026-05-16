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

  const body = await req.json();
  const hours: Array<{ day_of_week: number; opens_at: string; closes_at: string; is_closed: boolean }> = body.hours || [];

  for (const h of hours) {
    await supabase.from("business_hours").upsert({
      day_of_week: h.day_of_week,
      opens_at: h.opens_at,
      closes_at: h.closes_at,
      is_closed: h.is_closed,
      updated_at: new Date().toISOString()
    }, { onConflict: "day_of_week" });
  }

  return NextResponse.json({ ok: true });
}
