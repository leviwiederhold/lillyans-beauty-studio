import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(["cancel_requested", "reschedule_requested"])
});

export async function PATCH(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!data.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const client = await supabase.from("clients").select("id").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  if (!client.data) return NextResponse.json({ error: "Client profile not found." }, { status: 404 });

  const note = parsed.data.action === "cancel_requested" ? "Client requested cancellation." : "Client requested reschedule.";
  const booking = await supabase.from("bookings").select("internal_notes").eq("id", parsed.data.booking_id).eq("client_id", client.data.id).maybeSingle();
  if (!booking.data) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const { error } = await supabase.from("bookings").update({
    internal_notes: [booking.data.internal_notes, note].filter(Boolean).join("\n"),
    updated_at: new Date().toISOString()
  }).eq("id", parsed.data.booking_id).eq("client_id", client.data.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
