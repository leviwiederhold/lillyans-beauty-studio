import { NextResponse } from "next/server";
import { assertBookingSlotAvailable } from "@/lib/booking-rules";
import { notifyAdmin, notifyClient } from "@/lib/notifications";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const body = await request.json();
  const bookingId = typeof body.booking_id === "string" ? body.booking_id : "";
  const startsAt = typeof body.starts_at === "string" ? body.starts_at : "";
  if (!bookingId || !startsAt) return NextResponse.json({ error: "Booking and new time are required." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const clientRes = await supabase
    .from("clients")
    .select("id,email")
    .or(`profile_id.eq.${userData.user.id},email.ilike.${userData.user.email}`)
    .limit(1)
    .maybeSingle();
  if (!clientRes.data) return NextResponse.json({ error: "Client profile not found." }, { status: 404 });

  const bookingRes = await supabase.from("bookings").select("*").eq("id", bookingId).eq("client_id", clientRes.data.id).single();
  if (!bookingRes.data) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const booking = bookingRes.data;
  if (["completed", "cancelled", "no-show"].includes(String(booking.status || ""))) {
    return NextResponse.json({ error: "This booking can no longer be rescheduled online." }, { status: 400 });
  }

  const service = booking.service_id
    ? await supabase.from("services").select("*").eq("id", booking.service_id).maybeSingle()
    : { data: null };
  const fallbackDuration = booking.starts_at && booking.ends_at
    ? Math.max(15, Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000))
    : 60;
  const availability = await assertBookingSlotAvailable({
    supabase,
    service: service.data || { duration_minutes: fallbackDuration },
    startsAt,
    excludeBookingId: booking.id
  });
  if (!availability.ok) return NextResponse.json({ error: availability.error }, { status: 409 });

  const carryover = ["paid", "waived", "paid_via_credit"].includes(String(booking.deposit_status || ""));
  const carryoverNote = carryover ? "Client rescheduled online. Original deposit/waiver carries over." : "Client rescheduled online.";
  const updatePayload: Record<string, unknown> = {
    starts_at: availability.starts.toISOString(),
    ends_at: availability.ends.toISOString(),
    updated_at: new Date().toISOString(),
    internal_notes: [booking.internal_notes, carryoverNote].filter(Boolean).join("\n")
  };
  if (carryover) {
    updatePayload.deposit_status = booking.deposit_status;
    updatePayload.deposit_paid_at = booking.deposit_paid_at;
    updatePayload.square_payment_id = booking.square_payment_id;
    updatePayload.square_order_id = booking.square_order_id;
    updatePayload.square_checkout_url = booking.square_checkout_url;
  }

  const { data, error } = await supabase.from("bookings").update(updatePayload).eq("id", booking.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const message = carryover
    ? "Booking rescheduled. Your original deposit will be applied to your rescheduled appointment."
    : "Booking rescheduled.";
  await notifyAdmin("Booking rescheduled", `${String(data.client_name)} rescheduled ${String(data.service_type)}.`);
  await notifyClient(userData.user.email, "Your booking was rescheduled", `${message} Lillyan's Beauty Studio has your updated appointment time.`);

  return NextResponse.json({ ok: true, booking: data, message });
}
