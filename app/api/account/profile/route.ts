import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!data.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const payload = {
    first_name: body.first_name || null,
    last_name: body.last_name || null,
    email: String(body.email || data.user.email).toLowerCase(),
    phone: body.phone || null,
    address: body.address || null,
    medications: body.medications || null,
    allergies: body.allergies || null,
    skin_conditions: body.skin_conditions || null,
    profile_id: data.user.id,
    updated_at: new Date().toISOString()
  };

  const existing = await supabase.from("clients").select("id").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const result = existing.data
    ? await supabase.from("clients").update(payload).eq("id", existing.data.id)
    : await supabase.from("clients").insert(payload);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
