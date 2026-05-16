import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const formSchema = z.object({
  userId:          z.string().uuid(),
  bookingId:       z.string().uuid().nullable().optional(),
  formType:        z.union([z.literal("pmu_intake"), z.literal("informed_consent"), z.literal("liability_waiver"), z.literal("confidential_intake")]),
  serviceCategory: z.string().optional(),
  serviceName:     z.string().optional(),
  submittedAt:     z.string(),
  fields:          z.record(z.string(), z.unknown()).optional(),
  signature:       z.string().nullable().optional(),
  signature2:      z.string().nullable().optional(),
});

export async function POST(request: Request) {
  // Require authenticated session
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Ensure userId in payload matches the authenticated user
  if (parsed.data.userId !== userData.user.id) {
    return NextResponse.json({ error: "User mismatch." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("client_forms")
    .insert({
      user_id:          parsed.data.userId,
      booking_id:       parsed.data.bookingId ?? null,
      form_type:        parsed.data.formType,
      service_category: parsed.data.serviceCategory ?? null,
      service_name:     parsed.data.serviceName ?? null,
      submitted_at:     parsed.data.submittedAt,
      fields:           parsed.data.fields ?? {},
      signature:        parsed.data.signature ?? null,
      signature2:       parsed.data.signature2 ?? null,
      reviewed:         false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
