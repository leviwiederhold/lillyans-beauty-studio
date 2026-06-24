import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { adminBookingUpdateSchema } from "@/lib/validation";
import { notifyClient } from "@/lib/notifications";
import { assertBookingSlotAvailable } from "@/lib/booking-rules";
import { markGiftCertificateUsed, validateGiftCertificateCode } from "@/lib/gift-certificates";

export async function PATCH(request: Request) {
  const { user } = await requireAdmin();
  const parsed = adminBookingUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const { booking_id, ...updates } = parsed.data;
  if (!booking_id) return NextResponse.json({ error: "Booking is required." }, { status: 400 });
  const { data: before } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
  if (!before) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const finalUpdates: Record<string, unknown> = {
    ...updates,
    ...(updates.deposit_status === "paid" ? { deposit_paid_at: new Date().toISOString(), status: "confirmed" } : {}),
    updated_at: new Date().toISOString()
  };
  delete finalUpdates.gift_card_code_id;
  for (const key of ["starts_at", "ends_at", "gift_card_code", "waiver_reason", "deposit_status", "internal_notes"] as const) {
    if (finalUpdates[key] === "") delete finalUpdates[key];
  }

  if (updates.starts_at) {
    const service = before.service_id
      ? await supabase.from("services").select("*").eq("id", before.service_id).maybeSingle()
      : { data: null };
    const fallbackDuration = before.starts_at && before.ends_at
      ? Math.max(15, Math.round((new Date(before.ends_at).getTime() - new Date(before.starts_at).getTime()) / 60000))
      : 60;
    const availability = await assertBookingSlotAvailable({
      supabase,
      service: service.data || { duration_minutes: fallbackDuration },
      startsAt: updates.starts_at,
      excludeBookingId: booking_id
    });
    if (!availability.ok) return NextResponse.json({ error: availability.error }, { status: 409 });
    finalUpdates.starts_at = availability.starts.toISOString();
    finalUpdates.ends_at = updates.ends_at || availability.ends.toISOString();
    if (["paid", "waived", "paid_via_credit"].includes(String(before.deposit_status || ""))) {
      finalUpdates.deposit_status = before.deposit_status;
      finalUpdates.deposit_paid_at = before.deposit_paid_at;
      finalUpdates.square_payment_id = before.square_payment_id;
      finalUpdates.square_order_id = before.square_order_id;
      finalUpdates.square_checkout_url = before.square_checkout_url;
      const carryoverNote = "Original deposit/waiver carries over to the rescheduled appointment.";
      finalUpdates.internal_notes = [before.internal_notes, updates.internal_notes, carryoverNote].filter(Boolean).join("\n");
    }
  }

  let appliedGiftCertificate: Awaited<ReturnType<typeof validateGiftCertificateCode>> | null = null;
  const incomingCode = updates.gift_card_code?.trim();
  if (incomingCode) {
    appliedGiftCertificate = await validateGiftCertificateCode(supabase, incomingCode);
    if (!appliedGiftCertificate.valid) return NextResponse.json({ error: appliedGiftCertificate.message }, { status: 400 });
    finalUpdates.deposit_required = false;
    finalUpdates.deposit_status = "waived";
    finalUpdates.waiver_reason = "gift_certificate";
    finalUpdates.gift_card_code_id = appliedGiftCertificate.code.id;
    finalUpdates.gift_certificate_code_id = appliedGiftCertificate.code.id;
    finalUpdates.gift_card_code = incomingCode;
    finalUpdates.gift_card_status = "accepted";
  } else if (updates.deposit_required === false) {
    finalUpdates.deposit_status = "waived";
    finalUpdates.waiver_reason = updates.waiver_reason || "admin_override";
  } else if (updates.deposit_required === true && before.deposit_status !== "paid") {
    finalUpdates.waiver_reason = null;
    finalUpdates.gift_card_code_id = null;
    finalUpdates.gift_certificate_code_id = null;
    finalUpdates.gift_card_status = null;
    finalUpdates.deposit_status = updates.deposit_status || "unpaid";
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(finalUpdates)
    .eq("id", booking_id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (appliedGiftCertificate?.valid) {
    await markGiftCertificateUsed({
      supabase,
      code: appliedGiftCertificate.code,
      clientId: data.client_id || null,
      bookingId: data.id,
      usageCount: appliedGiftCertificate.usageCount,
      amountWaived: Number(before.deposit_amount || before.deposit_amount_cents || 0)
    });
  }

  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: "booking.update",
    table_name: "bookings",
    record_id: booking_id,
    before_data: before,
    after_data: data
  });

  if (updates.status === "confirmed" || updates.status === "denied" || updates.status === "cancelled") {
    await notifyClient(data.email, `Your booking request was ${updates.status}`, `Your ${data.service_type} booking request status is now ${updates.status}.`);
  }
  if (!updates.status && (updates.starts_at || updates.ends_at)) {
    const depositCopy = ["paid", "waived", "paid_via_credit"].includes(String(data.deposit_status || ""))
      ? " Your original deposit will be applied to your rescheduled appointment."
      : "";
    await notifyClient(data.email, "Your booking was rescheduled", `Your ${data.service_type} appointment time has been updated.${depositCopy}`);
  }

  return NextResponse.json({ ok: true, booking: data });
}

export async function POST(request: Request) {
  const { user } = await requireAdmin();
  const parsed = adminBookingUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { booking_id, ...payload } = parsed.data;
  if (!payload.service_type) return NextResponse.json({ error: "Service type is required." }, { status: 400 });
  const { data, error } = await supabase.from("bookings").insert({
    ...payload,
    status: payload.status || "confirmed",
    deposit_status: payload.deposit_status || "pending"
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("admin_audit_log").insert({ admin_user_id: user.id, action: "booking.create", table_name: "bookings", record_id: data.id, after_data: data });
  return NextResponse.json({ ok: true, booking: data });
}
