import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  date_of_birth: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  emergency_contact_name: z.string().trim().optional(),
  emergency_contact_phone: z.string().trim().optional(),
  medications: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  skin_conditions: z.string().trim().optional(),
  previous_procedures: z.string().trim().optional(),
  confirmed_current: z.coerce.boolean().refine(Boolean)
});

export async function POST(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!data.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please confirm your medical information is accurate." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const body = parsed.data;
  const clientPayload = {
    profile_id: data.user.id,
    email: data.user.email.toLowerCase(),
    phone: body.phone || null,
    date_of_birth: body.date_of_birth || null,
    address: body.address || null,
    emergency_contact_name: body.emergency_contact_name || null,
    emergency_contact_phone: body.emergency_contact_phone || null,
    medications: body.medications || null,
    allergies: body.allergies || null,
    skin_conditions: body.skin_conditions || null,
    previous_procedures: body.previous_procedures || null,
    updated_at: new Date().toISOString()
  };

  const existing = await supabase.from("clients").select("id,first_name,last_name").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = existing.data
    ? await supabase.from("clients").update(clientPayload).eq("id", existing.data.id).select("*").single()
    : await supabase.from("clients").insert(clientPayload).select("*").single();

  if (client.error || !client.data) return NextResponse.json({ error: client.error?.message || "Could not save client profile." }, { status: 500 });

  await supabase.from("intake_forms").update({ is_default: false }).eq("client_id", client.data.id);

  const now = new Date().toISOString();
  const form = await supabase.from("intake_forms").insert({
    client_id: client.data.id,
    type: "facial",
    service_label: "Current Medical Profile",
    service_details: {},
    consent_accuracy: true,
    consent_updates: true,
    consent_policy: true,
    signature: [client.data.first_name, client.data.last_name].filter(Boolean).join(" ") || data.user.email,
    signature_date: now.slice(0, 10),
    raw_payload: body,
    is_default: true,
    confirmed_current: true,
    last_reviewed_at: now,
    updated_at: now
  }).select("*").single();

  if (form.error) return NextResponse.json({ error: form.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, form: form.data });
}
