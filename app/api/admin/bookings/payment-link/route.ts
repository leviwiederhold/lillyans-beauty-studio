import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSquareDepositLink } from "@/lib/square";
import { notifyClient } from "@/lib/notifications";

export async function POST(request: Request) {
  const { user } = await requireAdmin();
  const { booking_id } = await request.json();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
  if (error || !booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (!booking.deposit_required || !booking.deposit_amount) return NextResponse.json({ error: "This booking does not require a deposit." }, { status: 400 });

  const square = await createSquareDepositLink({
    bookingId: booking.id,
    serviceName: booking.service_type,
    amount: booking.deposit_amount,
    clientEmail: booking.email
  });
  await supabase.from("bookings").update({
    square_checkout_url: square.url,
    square_order_id: square.orderId || null,
    deposit_status: "payment_link_sent"
  }).eq("id", booking.id);
  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: "booking.resend_square_payment_link",
    table_name: "bookings",
    record_id: booking.id,
    after_data: square
  });
  await notifyClient(booking.email, "Your deposit payment link", `Please pay your 20% deposit here: ${square.url}`);
  return NextResponse.json({ ok: true, url: square.url });
}
