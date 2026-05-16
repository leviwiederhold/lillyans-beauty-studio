import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifySquareWebhookSignature } from "@/lib/square";
import { notifyAdmin, notifyClient } from "@/lib/notifications";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/square/webhook`;
  if (!verifySquareWebhookSignature(rawBody, signature, notificationUrl)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const payment = event?.data?.object?.payment;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;
  const status = payment?.status;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  if (orderId && status === "COMPLETED") {
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    const membership = await supabase
      .from("memberships")
      .update({
        status: "active",
        is_active: true,
        payment_status: "paid",
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: nextBilling.toISOString(),
        next_billing_at: nextBilling.toISOString(),
        square_payment_id: paymentId || null,
        square_order_id: orderId
      })
      .eq("square_order_id", orderId)
      .in("status", ["checkout_pending", "pending"])
      .select("*")
      .maybeSingle();

    if (membership.data) {
      await notifyAdmin("Square membership paid", `${membership.data.email || "A client"} joined ${membership.data.plan_name}.`);
      await notifyClient(membership.data.email, "Your membership is active", `Your ${membership.data.plan_name} membership is active.`);
      return NextResponse.json({ ok: true });
    }

    const { data: booking } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        deposit_status: "paid",
        deposit_paid_at: new Date().toISOString(),
        square_payment_id: paymentId || null,
        square_order_id: orderId
      })
      .eq("square_order_id", orderId)
      .select("*")
      .maybeSingle();

    if (booking) {
      await supabase.from("deposits").update({
        status: "paid",
        updated_at: new Date().toISOString()
      }).eq("booking_id", booking.id);
      await notifyAdmin("Square deposit paid", `${booking.client_name} paid a deposit for ${booking.service_type}.`);
      await notifyClient(booking.email, "Your booking is confirmed", `Your ${booking.service_type} booking is confirmed. Remaining balance is due in person.`);
    }
  }

  if (orderId && (status === "FAILED" || status === "CANCELED")) {
    await supabase.from("bookings").update({ deposit_status: "failed" }).eq("square_order_id", orderId);
    await supabase.from("memberships").update({ payment_status: "failed", is_active: false }).eq("square_order_id", orderId);
  }

  return NextResponse.json({ ok: true });
}
