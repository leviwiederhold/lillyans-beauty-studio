import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifySquareWebhookSignature } from "@/lib/square";
import { notifyAdmin, notifyClient } from "@/lib/notifications";
import crypto from "node:crypto";

function generateGiftCardCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [4, 4, 4].map(() =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return segments.join("-");
}

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
  const paymentNote: string = payment?.note || "";
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  // ── Gift card purchase ───────────────────────────────────────────────────
  if (status === "COMPLETED" && paymentNote.startsWith("gift_card:")) {
    // note format: gift_card:{recipientEmail}:{amountCents}:{recipientName}
    const parts = paymentNote.split(":");
    const recipientEmail = parts[1] ?? "";
    const amountCents = parseInt(parts[2] ?? "0", 10);
    const recipientName = parts[3] ?? "";

    const code = generateGiftCardCode();
    await supabase.from("gift_card_codes").insert({
      code,
      description: `Gift card — $${(amountCents / 100).toFixed(0)}`,
      is_active: true,
      allow_reuse: false,
      balance_cents: amountCents,
      recipient_email: recipientEmail || null,
      purchased_at: new Date().toISOString(),
      square_order_id: orderId || null,
    });

    const dollars = (amountCents / 100).toFixed(0);
    await notifyClient(
      recipientEmail,
      `Your $${dollars} Gift Card — Lillyan's Beauty Studio`,
      `${recipientName ? `Hi ${recipientName}! ` : ""}You received a $${dollars} gift card from Lillyan's Beauty Studio.\n\nYour code: ${code}\n\nUse this code at checkout when booking your appointment.`
    );
    await notifyAdmin(
      "Gift card purchased",
      `A $${dollars} gift card was purchased. Code ${code} sent to ${recipientEmail}.`
    );
    return NextResponse.json({ ok: true });
  }

  // ── Membership purchase ──────────────────────────────────────────────────
  if (status === "COMPLETED" && paymentNote.startsWith("membership:")) {
    // note format: membership:{plan_id}:{user_id}
    const parts = paymentNote.split(":");
    const planId = parts[1] ?? "";
    const userId = parts[2] ?? "";

    if (planId && userId) {
      const { data: plan } = await supabase
        .from("memberships")
        .select("id, name, plan_name, price_cents")
        .eq("id", planId)
        .eq("status", "plan")
        .maybeSingle();

      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      // Find the client record associated with this user
      const { data: client } = await supabase
        .from("clients")
        .select("id, email, first_name")
        .eq("profile_id", userId)
        .maybeSingle();

      const planName = String((plan as { name?: string; plan_name?: string } | null)?.name ?? (plan as { name?: string; plan_name?: string } | null)?.plan_name ?? "Membership");
      const nowIso = new Date().toISOString();
      await supabase.from("memberships").insert({
        client_id: client?.id ?? null,
        plan_ref_id: planId || null,
        plan_name: planName,
        status: "active",
        payment_status: "paid",
        is_active: true,
        start_date: nowIso.slice(0, 10),     // date column the account/admin UI reads
        started_at: nowIso,                   // timestamptz audit column
        renewal_date: renewalDate.toISOString().slice(0, 10),
        square_order_id: orderId || null,
      });

      if (client?.email) {
        await notifyClient(
          client.email,
          `Welcome to ${planName} — Lillyan's Beauty Studio`,
          `Hi ${String(client.first_name ?? "there")}! Your ${planName} is now active. Your next renewal date is ${renewalDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
        );
      }
      await notifyAdmin(
        "New membership purchase",
        `${String(client?.first_name ?? userId)} subscribed to ${planName}.`
      );
    }
    return NextResponse.json({ ok: true });
  }

  // ── Booking deposit ──────────────────────────────────────────────────────
  if (orderId && status === "COMPLETED" && paymentNote.startsWith("booking_id:")) {
    const { data: booking } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        deposit_status: "paid",
        deposit_paid_at: new Date().toISOString(),
        square_payment_id: paymentId || null,
        square_order_id: orderId,
      })
      .eq("square_order_id", orderId)
      .select("*")
      .maybeSingle();

    if (booking) {
      await supabase.from("deposits").update({
        status: "paid",
        updated_at: new Date().toISOString(),
      }).eq("booking_id", booking.id);
      await notifyAdmin("Square deposit paid", `${String(booking.client_name)} paid a deposit for ${String(booking.service_type)}.`);
      await notifyClient(booking.email, "Your booking is confirmed", `Your ${String(booking.service_type)} booking is confirmed. Remaining balance is due in person.`);
    }
  }

  if (orderId && (status === "FAILED" || status === "CANCELED") && paymentNote.startsWith("booking_id:")) {
    await supabase.from("bookings").update({ deposit_status: "failed" }).eq("square_order_id", orderId);
  }

  return NextResponse.json({ ok: true });
}
