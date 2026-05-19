import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlots } from "@/lib/availability";
import { bookingRequestSchema } from "@/lib/validation";
import { notifyAdmin, notifyClient } from "@/lib/notifications";
import { createSquareDepositLink, squareConfigured } from "@/lib/square";

export async function POST(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) return NextResponse.json({ error: "Sign in is required before booking." }, { status: 401 });
  const parsed = bookingRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const data = parsed.data;

  const service = await supabase.from("services").select("*").eq("id", data.service_id).eq("is_active", true).single();
  if (service.error) return NextResponse.json({ error: "Service not found." }, { status: 404 });

  const starts = new Date(data.starts_at);
  const date = data.starts_at.slice(0, 10);
  const dayStart = new Date(`${date}T00:00:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59`).toISOString();
  const [rules, bookings, blocked] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("is_active", true),
    supabase.from("bookings").select("starts_at,ends_at").in("status", ["pending", "confirmed"]).gte("starts_at", dayStart).lte("starts_at", dayEnd),
    supabase.from("blocked_times").select("starts_at,ends_at").lte("starts_at", dayEnd).gte("ends_at", dayStart)
  ]);
  const slots = generateSlots({
    date,
    durationMinutes: service.data.duration_minutes,
    rules: rules.data || [],
    bookings: (bookings.data || []).filter((b) => b.starts_at && b.ends_at) as { starts_at: string; ends_at: string }[],
    blockedTimes: blocked.data || []
  });
  if (!slots.includes(starts.toISOString())) return NextResponse.json({ error: "That time is no longer available." }, { status: 409 });

  const code = data.gift_card_code?.trim();
  let depositRequired = true;
  let giftCardStatus = null;
  let giftCardCodeId: string | null = null;
  let giftCardUsedCount = 0;
  if (code) {
    const waiver = await supabase.from("gift_card_codes").select("id,used_count,allow_reuse,redeemed_at").ilike("code", code).eq("is_active", true).maybeSingle();
    if (waiver.data) {
      if (!waiver.data.allow_reuse && (waiver.data.used_count > 0 || waiver.data.redeemed_at)) {
        return NextResponse.json({ error: "This gift card/code has already been used." }, { status: 400 });
      }
      depositRequired = false;
      giftCardStatus = "accepted";
      giftCardCodeId = waiver.data.id;
      giftCardUsedCount = waiver.data.used_count || 0;
    } else {
      return NextResponse.json({ error: "Gift card/code was not found. Please check the code or continue without it to pay the 20% deposit." }, { status: 400 });
    }
  }

  const bookingEmail = userData.user.email;
  const existingClient = await supabase.from("clients").select("id").or(`profile_id.eq.${userData.user.id},email.ilike.${bookingEmail}`).limit(1).maybeSingle();
  const clientPayload = { first_name: data.first_name, last_name: data.last_name || null, email: bookingEmail.toLowerCase(), phone: data.phone || null, profile_id: userData.user.id, updated_at: new Date().toISOString() };
  const client = existingClient.data
    ? await supabase.from("clients").update(clientPayload).eq("id", existingClient.data.id).select("id").single()
    : await supabase.from("clients").insert(clientPayload).select("id").single();

  if (service.data.requires_intake && (!data.consent_accuracy || !data.consent_updates || !data.consent_policy || !data.signature)) {
    return NextResponse.json({ error: "Required intake consent and signature are missing." }, { status: 400 });
  }
  const settings = await supabase.from("business_settings").select("gift_card_auto_confirm").eq("id", 1).maybeSingle();

  const ends = new Date(starts.getTime() + service.data.duration_minutes * 60000);
  const serviceTotal = Number(service.data.service_total || 0);
  const depositPercent = 20;
  const depositAmount = depositRequired && serviceTotal > 0 ? Math.round(serviceTotal * (depositPercent / 100)) : 0;
  const remainingBalance = Math.max(serviceTotal - depositAmount, 0);
  const canCreateSquareCheckout = depositRequired && depositAmount > 0 && squareConfigured();
  const booking = await supabase.from("bookings").insert({
    client_id: client.data?.id || null,
    service_id: service.data.id,
    client_name: `${data.first_name} ${data.last_name || ""}`.trim(),
    email: bookingEmail,
    phone: data.phone || null,
    service_type: service.data.name,
    status: depositRequired ? "pending" : settings.data?.gift_card_auto_confirm ? "confirmed" : "pending_admin_confirmation",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    deposit_required: depositRequired,
    deposit_status: depositRequired ? canCreateSquareCheckout ? "payment_link_pending" : "pending" : "waived",
    waiver_reason: depositRequired ? null : "gift_card",
    gift_card_code_id: giftCardCodeId,
    service_total: serviceTotal,
    deposit_percent: depositPercent,
    deposit_amount: depositAmount,
    remaining_balance: remainingBalance,
    deposit_amount_cents: depositAmount || service.data.deposit_amount_cents || null,
    gift_card_code: code || null,
    gift_card_status: giftCardStatus,
    notes: data.notes || null
  }).select("*").single();
  if (booking.error) {
    // Unique constraint violation — another booking just took this slot
    if (booking.error.code === "23505") {
      return NextResponse.json({ error: "That time was just taken by another booking. Please choose a different time." }, { status: 409 });
    }
    return NextResponse.json({ error: booking.error.message }, { status: 500 });
  }

  if (service.data.requires_intake) {
    await supabase.from("intake_forms").insert({
      client_id: client.data?.id || null,
      type: service.data.intake_type || "wedding_inquiry",
      service_label: service.data.name,
      service_details: {
        medications: data.medications || "",
        allergies: data.allergies || "",
        skin_conditions: data.skin_conditions || "",
        previous_procedures: data.previous_procedures || ""
      },
      consent_accuracy: true,
      consent_updates: true,
      consent_policy: true,
      signature: data.signature,
      signature_date: new Date().toISOString().slice(0, 10),
      raw_payload: data
    });
  }

  if (depositRequired && depositAmount > 0) {
    await supabase.from("deposits").insert({ booking_id: booking.data.id, amount_cents: depositAmount, status: "pending" });
  }
  let squareCheckoutUrl: string | null = null;
  if (canCreateSquareCheckout) {
    const square = await createSquareDepositLink({
      bookingId: booking.data.id,
      serviceName: service.data.name,
      amount: depositAmount,
      clientEmail: bookingEmail
    });
    squareCheckoutUrl = square.url;
    await supabase.from("bookings").update({
      square_checkout_url: square.url,
      square_order_id: square.orderId || null,
      deposit_status: "payment_link_sent"
    }).eq("id", booking.data.id);
  }
  if (code && giftCardStatus === "accepted") {
    await supabase.from("gift_card_code_redemptions").insert({ client_id: client.data?.id || null, booking_id: booking.data.id, code, status: "accepted" });
    await supabase.from("gift_card_codes").update({ used_count: giftCardUsedCount + 1, redeemed_at: new Date().toISOString() }).eq("id", giftCardCodeId);
  }

  await notifyAdmin("New booking request", `${booking.data.client_name} requested ${service.data.name} on ${starts.toLocaleString()}.`);
  await notifyClient(bookingEmail, "Your booking request was received", depositRequired && squareCheckoutUrl ? `We received your ${service.data.name} booking request. Please pay the 20% deposit to confirm: ${squareCheckoutUrl}` : `We received your ${service.data.name} booking request. Lilly will confirm it soon.`);
  return NextResponse.json({ ok: true, booking: booking.data, square_checkout_url: squareCheckoutUrl, requires_intake: service.data.requires_intake, intake_type: service.data.intake_type });
}
