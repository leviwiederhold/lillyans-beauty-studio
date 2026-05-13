import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { adminBookingUpdateSchema } from "@/lib/validation";
import { notifyClient } from "@/lib/notifications";

export async function PATCH(request: Request) {
  const { user } = await requireAdmin();
  const parsed = adminBookingUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const { booking_id, ...updates } = parsed.data;
  const { data: before } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
  const finalUpdates = {
    ...updates,
    ...(updates.deposit_status === "paid" ? { deposit_paid_at: new Date().toISOString(), status: "confirmed" } : {}),
    ...(updates.deposit_required === false ? { deposit_status: "waived" } : {}),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from("bookings")
    .update(finalUpdates)
    .eq("id", booking_id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    await notifyClient(data.email, "Your booking was rescheduled", `Your ${data.service_type} appointment time has been updated.`);
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
