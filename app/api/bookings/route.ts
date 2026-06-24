import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { assertBookingSlotAvailable } from "@/lib/booking-rules";
import { markGiftCertificateUsed, validateGiftCertificateCode } from "@/lib/gift-certificates";
import { missingForms } from "@/lib/intake";
import { bookingRequestSchema } from "@/lib/validation";
import { notifyAdmin, notifyClient } from "@/lib/notifications";
import { createSquareDepositLink, squareConfigured } from "@/lib/square";

// ── Simple in-memory rate limiter (per-IP, per-process) ──────────────────────
const BOOKING_WINDOW_MS = 60_000;
const BOOKING_MAX = 5;
const bookingAttempts = new Map<string, { count: number; resetAt: number }>();

function bookingRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = bookingAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    bookingAttempts.set(ip, { count: 1, resetAt: now + BOOKING_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > BOOKING_MAX;
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (bookingRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }
  const auth = await createSupabaseServerClient();
  const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!userData.user?.email) return NextResponse.json({ error: "Sign in is required before booking." }, { status: 401 });
  const parsed = bookingRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const data = parsed.data;

  const service = await supabase.from("services").select("*, service_categories(name)").eq("id", data.service_id).eq("is_active", true).single();
  if (service.error) return NextResponse.json({ error: "Service not found." }, { status: 404 });

  const availability = await assertBookingSlotAvailable({
    supabase,
    service: service.data,
    startsAt: data.starts_at
  });
  if (!availability.ok) return NextResponse.json({ error: availability.error }, { status: 409 });
  const starts = availability.starts;
  const ends = availability.ends;

  const code = data.gift_card_code?.trim();
  let depositRequired = service.data.requires_deposit !== false;
  let giftCardStatus: string | null = null;
  let giftCardCodeId: string | null = null;
  let giftCertificate: Awaited<ReturnType<typeof validateGiftCertificateCode>> | null = null;
  let waiverReason: string | null = depositRequired ? null : "service_no_deposit";

  const bookingEmail = userData.user.email;
  const existingClient = await supabase.from("clients").select("id").or(`profile_id.eq.${userData.user.id},email.ilike.${bookingEmail}`).limit(1).maybeSingle();
  const clientPayload = { first_name: data.first_name, last_name: data.last_name || null, email: bookingEmail.toLowerCase(), phone: data.phone || null, profile_id: userData.user.id, updated_at: new Date().toISOString() };
  const client = existingClient.data
    ? await supabase.from("clients").update(clientPayload).eq("id", existingClient.data.id).select("id").single()
    : await supabase.from("clients").insert(clientPayload).select("id").single();
  if (client.error) return NextResponse.json({ error: client.error.message }, { status: 500 });

  if (code) {
    giftCertificate = await validateGiftCertificateCode(supabase, code);
    if (!giftCertificate.valid) return NextResponse.json({ error: giftCertificate.message }, { status: 400 });
    depositRequired = false;
    waiverReason = "gift_certificate";
    giftCardStatus = "accepted";
    giftCardCodeId = String(giftCertificate.code.id);
  }

  if (depositRequired) {
    const membership = await supabase
      .from("memberships")
      .select("id")
      .eq("client_id", client.data.id)
      .eq("status", "active")
      .maybeSingle();
    if (membership.data) {
      depositRequired = false;
      waiverReason = "membership";
    }
  }

  // Intake gate: intake/consent forms are submitted separately to /api/forms
  // (stored in client_forms), not in the booking payload. Verify the required
  // forms for this service's category are actually on file for this user before
  // allowing the booking.
  if (service.data.requires_intake) {
    const categoryName = (service.data.service_categories as { name?: string } | null)?.name ?? null;
    const onFile = await supabase
      .from("client_forms")
      .select("form_type")
      .eq("user_id", userData.user.id);
    const onFileTypes = (onFile.data ?? []).map((f) => f.form_type as string);
    const missing = missingForms(categoryName, onFileTypes);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Please complete your required intake forms before booking.", missingForms: missing },
        { status: 400 }
      );
    }
  }
  const settings = await supabase.from("business_settings").select("gift_card_auto_confirm").eq("id", 1).maybeSingle();

  const serviceTotal = Number(service.data.service_total || 0);
  const depositPercent = 20;
  const requiredDepositAmount = serviceTotal > 0 ? Math.round(serviceTotal * (depositPercent / 100)) : Number(service.data.deposit_amount_cents || 0);
  const depositAmount = depositRequired ? requiredDepositAmount : 0;
  const remainingBalance = Math.max(serviceTotal - depositAmount, 0);
  const canCreateSquareCheckout = depositRequired && depositAmount > 0 && squareConfigured();
  if (depositRequired && depositAmount > 0 && !canCreateSquareCheckout) {
    return NextResponse.json({ error: "Deposit payments are not configured yet. Please contact the studio to book." }, { status: 503 });
  }
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
    deposit_status: depositRequired ? "unpaid" : "waived",
    waiver_reason: depositRequired ? null : waiverReason,
    gift_card_code_id: giftCardCodeId,
    gift_certificate_code_id: giftCardCodeId,
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

  // Note: intake/consent forms are submitted separately via /api/forms and stored
  // in client_forms (the canonical store, shown under admin "Client Forms"). We no
  // longer write a placeholder row to the legacy intake_forms table here.

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
      deposit_status: "unpaid"
    }).eq("id", booking.data.id);
  }
  if (giftCertificate?.valid) {
    await markGiftCertificateUsed({
      supabase,
      code: giftCertificate.code,
      clientId: client.data.id,
      bookingId: booking.data.id,
      usageCount: giftCertificate.usageCount,
      amountWaived: requiredDepositAmount
    });
  }

  await notifyAdmin("New booking request", `${booking.data.client_name} requested ${service.data.name} on ${starts.toLocaleString()}.`);
  await notifyClient(
    bookingEmail,
    "Your booking request was received",
    depositRequired && squareCheckoutUrl
      ? `We received your ${service.data.name} booking request. Please pay the 20% deposit to confirm: ${squareCheckoutUrl}`
      : waiverReason === "gift_certificate"
      ? `Gift certificate applied. No deposit is due today. Lilly will confirm your ${service.data.name} booking soon.`
      : `We received your ${service.data.name} booking request. Lilly will confirm it soon.`
  );
  return NextResponse.json({ ok: true, booking: booking.data, square_checkout_url: squareCheckoutUrl, requires_intake: service.data.requires_intake, intake_type: service.data.intake_type });
}
