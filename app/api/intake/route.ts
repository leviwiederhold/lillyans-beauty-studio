import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { intakeFormSchema } from "@/lib/validation";
import { notifyAdmin, notifyClient } from "@/lib/notifications";

export async function GET(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) return NextResponse.json({ error: "Sign in is required before viewing intake information." }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .or(`profile_id.eq.${userData.user.id},email.ilike.${userData.user.email}`)
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function POST(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) return NextResponse.json({ error: "Sign in is required before submitting intake forms." }, { status: 401 });
  const body = await request.json();
  const parsed = intakeFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const { website, type, service_label, service_details, consent_accuracy, consent_updates, consent_policy, signature, signature_date, ...clientData } = parsed.data;
  const email = userData.user.email.toLowerCase();

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .or(`profile_id.eq.${userData.user.id},email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  const clientPayload = {
    ...clientData,
    email,
    profile_id: userData.user.id,
    updated_at: new Date().toISOString()
  };

  const { data: client, error: clientError } = existing
    ? await supabase.from("clients").update(clientPayload).eq("id", existing.id).select("id").single()
    : await supabase.from("clients").insert(clientPayload).select("id").single();

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 });

  const { error } = await supabase.from("intake_forms").insert({
    client_id: client.id,
    type,
    service_label,
    service_details,
    consent_accuracy,
    consent_updates,
    consent_policy,
    signature,
    signature_date,
    raw_payload: parsed.data
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await notifyAdmin("New Lillyan's Beauty Studio intake form", `${clientData.first_name} ${clientData.last_name} submitted a ${service_label} intake form.`);
  await notifyClient(email, "Your intake form was received", "Your intake form has been saved. Lilly will review it before your appointment.");
  return NextResponse.json({ ok: true });
}
