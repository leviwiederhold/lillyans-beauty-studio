import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlots, easternDayBounds, meetsMinimumNotice } from "@/lib/availability";
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

  // Studio-configurable rules.
  const settings = await supabase.from("business_settings")
    .select("gift_card_auto_confirm, booking_minimum_notice_hours, intake_expiration_months")
    .eq("id", 1).maybeSingle();
  const minNoticeHours = Number(settings.data?.booking_minimum_notice_hours ?? 48);
  const intakeExpirationMonths = Number(settings.data?.intake_expiration_months ?? 6);

  const starts = new Date(data.starts_at);

  // Lead-time rule: clients may not self-book inside the minimum-notice window.
  // (Admins create short-notice bookings via /api/admin/bookings, which is exempt.)
  if (!meetsMinimumNotice(starts, minNoticeHours)) {
    return NextResponse.json(
      { error: `Appointments must be booked at least ${minNoticeHours} hours in advance.` },
      { status: 400 }
    );
  }

  const date = data.starts_at.slice(0, 10);
  const { dayStart, dayEnd } = easternDayBounds(date);
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
    blockedTimes: blocked.data || [],
    minNoticeHours
  });
  if (!slots.includes(starts.toISOString())) return NextResponse.json({ error: "That time is no longer available." }, { status: 409 });

  const code = data.gift_card_code?.trim();
  // Respect the service's deposit configuration (default to requiring a deposit).
  let depositRequired = service.data.requires_deposit !== false;
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

  // Determine why a deposit is waived, for accurate record-keeping.
  // Precedence: a service that requires no deposit < gift card < active membership.
  let waiverReason: string | null = depositRequired ? null : "no_deposit";
  if (giftCardCodeId) waiverReason = "gift_card";

  // Check for an active membership → waive deposit. memberships.client_id references
  // clients.id, so resolve the caller's client row by profile_id first.
  if (depositRequired) {
    const clientLookup = await supabase.from("clients").select("id").eq("profile_id", userData.user.id).maybeSingle();
    if (clientLookup.data) {
      const membership = await supabase
        .from("memberships")
        .select("id")
        .eq("client_id", clientLookup.data.id)
        .eq("status", "active")
        .maybeSingle();
      if (membership.data) {
        depositRequired = false;
        waiverReason = "membership";
      }
    }
  }

  const bookingEmail = userData.user.email;
  const existingClient = await supabase.from("clients").select("id").or(`profile_id.eq.${userData.user.id},email.ilike.${bookingEmail}`).limit(1).maybeSingle();
  const clientPayload = { first_name: data.first_name, last_name: data.last_name || null, email: bookingEmail.toLowerCase(), phone: data.phone || null, profile_id: userData.user.id, updated_at: new Date().toISOString() };
  const client = existingClient.data
    ? await supabase.from("clients").update(clientPayload).eq("id", existingClient.data.id).select("id").single()
    : await supabase.from("clients").insert(clientPayload).select("id").single();

  // Intake gate: intake/consent forms are submitted separately to /api/forms
  // (stored in client_forms), not in the booking payload. Verify the required
  // forms for this service's category are (a) on file and (b) current — either
  // submitted or reviewed within the studio's expiration window. Capture the
  // form that satisfies the booking so it can be linked.
  let clientFormId: string | null = null;
  if (service.data.requires_intake) {
    const categoryName = (service.data.service_categories as { name?: string } | null)?.name ?? null;
    const onFile = await supabase
      .from("client_forms")
      .select("id, form_type, submitted_at, last_reviewed_at")
      .eq("user_id", userData.user.id)
      .order("submitted_at", { ascending: false });
    const rows = onFile.data ?? [];
    const onFileTypes = rows.map((f) => f.form_type as string);

    const missing = missingForms(categoryName, onFileTypes);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Please complete your required intake forms before booking.", missingForms: missing },
        { status: 400 }
      );
    }

    // Currency: the most-recent submit/review of any required form must be within
    // the expiration window.
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - intakeExpirationMonths);
    const requiredRows = rows.filter((f) => onFileTypes.includes(f.form_type as string));
    const freshness = (f: { submitted_at?: string | null; last_reviewed_at?: string | null }) =>
      Math.max(
        f.submitted_at ? new Date(f.submitted_at).getTime() : 0,
        f.last_reviewed_at ? new Date(f.last_reviewed_at).getTime() : 0
      );
    const mostRecent = requiredRows.reduce((best, f) => Math.max(best, freshness(f)), 0);
    if (mostRecent > 0 && mostRecent < cutoff.getTime()) {
      return NextResponse.json(
        { error: `Please review and confirm your intake information before booking — your forms are more than ${intakeExpirationMonths} months old.`, intakeOutdated: true },
        { status: 400 }
      );
    }

    // Link the most recently updated required form to this booking.
    clientFormId = (requiredRows.slice().sort((a, b) => freshness(b) - freshness(a))[0]?.id as string) ?? null;
  }

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
    waiver_reason: depositRequired ? null : waiverReason,
    gift_card_code_id: giftCardCodeId,
    service_total: serviceTotal,
    deposit_percent: depositPercent,
    deposit_amount: depositAmount,
    remaining_balance: remainingBalance,
    deposit_amount_cents: depositAmount || service.data.deposit_amount_cents || null,
    gift_card_code: code || null,
    gift_card_status: giftCardStatus,
    client_form_id: clientFormId,
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
      deposit_status: "payment_link_sent"
    }).eq("id", booking.data.id);
  }
  if (code && giftCardStatus === "accepted") {
    await supabase.from("gift_card_code_redemptions").insert({ client_id: client.data?.id || null, booking_id: booking.data.id, code, status: "accepted" });
    // Read current balance to decrement it
    const { data: gcRow } = await supabase.from("gift_card_codes").select("balance_cents").eq("id", giftCardCodeId).maybeSingle();
    const newBalance = Math.max(0, (gcRow?.balance_cents ?? 0) - depositAmount);
    await supabase.from("gift_card_codes").update({
      used_count: giftCardUsedCount + 1,
      redeemed_at: new Date().toISOString(),
      balance_cents: newBalance,
    }).eq("id", giftCardCodeId);
  }

  await notifyAdmin("New booking request", `${booking.data.client_name} requested ${service.data.name} on ${starts.toLocaleString()}.`);
  await notifyClient(bookingEmail, "Your booking request was received", depositRequired && squareCheckoutUrl ? `We received your ${service.data.name} booking request. Please pay the 20% deposit to confirm: ${squareCheckoutUrl}` : `We received your ${service.data.name} booking request. Lilly will confirm it soon.`);
  return NextResponse.json({ ok: true, booking: booking.data, square_checkout_url: squareCheckoutUrl, requires_intake: service.data.requires_intake, intake_type: service.data.intake_type });
}
