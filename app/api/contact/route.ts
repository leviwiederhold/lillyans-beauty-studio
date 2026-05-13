import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { contactInquirySchema } from "@/lib/validation";
import { notifyAdmin, notifyClient } from "@/lib/notifications";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { website, code, ...payload } = parsed.data;
  let depositRequired = true;
  const normalizedCode = code?.trim();

  let codeAccepted = false;
  if (normalizedCode) {
    const { data: waiver } = await supabase
      .from("gift_card_codes")
      .select("id, used_count")
      .ilike("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (waiver) {
      depositRequired = false;
      codeAccepted = true;
      await supabase
        .from("gift_card_codes")
        .update({ used_count: (waiver.used_count ?? 0) + 1 })
        .eq("id", waiver.id);
    }
  }

  const { data: inquiry, error } = await supabase.from("contact_inquiries").insert({
    ...payload,
    code: normalizedCode || null,
    deposit_required: depositRequired
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const clientPayload = {
    first_name: payload.name.split(" ")[0] || payload.name,
    last_name: payload.name.split(" ").slice(1).join(" ") || null,
    email: payload.email.toLowerCase(),
    phone: payload.phone || null,
    updated_at: new Date().toISOString()
  };
  const existingClient = await supabase.from("clients").select("id").ilike("email", payload.email).limit(1).maybeSingle();
  const { data: client } = existingClient.data
    ? await supabase.from("clients").update(clientPayload).eq("id", existingClient.data.id).select("id").single()
    : await supabase.from("clients").insert(clientPayload).select("id").single();

  const booking = await supabase.from("bookings").insert({
    client_id: client?.id || null,
    contact_inquiry_id: inquiry.id,
    client_name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    service_type: payload.subject,
    status: "pending",
    deposit_required: depositRequired,
    deposit_status: depositRequired ? "pending" : "waived",
    gift_card_code: normalizedCode || null,
    gift_card_status: codeAccepted ? "accepted" : normalizedCode ? "not_found" : null,
    notes: payload.message
  }).select("id").single();

  if (codeAccepted) {
    await supabase.from("gift_card_code_redemptions").insert({
      client_id: client?.id || null,
      contact_inquiry_id: inquiry.id,
      booking_id: booking.data?.id || null,
      code: normalizedCode,
      status: "accepted"
    });
  }

  await notifyAdmin("New Lillyan's Beauty Studio inquiry", `${payload.name} submitted a ${payload.subject} inquiry.\n\n${payload.message}`);
  await notifyClient(payload.email, "We received your Lillyan's Beauty Studio inquiry", "Thank you for reaching out. Lilly will review your inquiry and follow up personally.");
  return NextResponse.json({ ok: true, deposit_required: depositRequired });
}
