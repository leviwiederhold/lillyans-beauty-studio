import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, isAdminProfile } from "@/lib/auth-roles";

async function upsertClient(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!data.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
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

  const profile = await ensureProfileForUser(supabase, data.user);
  const fullName = [payload.first_name, payload.last_name].filter(Boolean).join(" ") || null;
  if (fullName) {
    await supabase.from("profiles").update({ full_name: fullName, updated_at: new Date().toISOString() }).eq("id", data.user.id);
  }

  if (isAdminProfile(profile)) {
    return NextResponse.json({ ok: true, role: "admin", is_admin: true });
  }

  const existing = await supabase.from("clients").select("id").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const result = existing.data
    ? await supabase.from("clients").update(payload).eq("id", existing.data.id)
    : await supabase.from("clients").insert(payload);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, role: "client", is_admin: false });
}

export async function POST(request: Request) {
  return upsertClient(request);
}

export async function PATCH(request: Request) {
  return upsertClient(request);
}
