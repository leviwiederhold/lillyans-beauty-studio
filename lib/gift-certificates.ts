type SupabaseAdmin = {
  from: (table: string) => any;
};

export type GiftCertificateValidation =
  | { valid: true; code: Record<string, any>; usageCount: number; usageLimit: number | null }
  | { valid: false; message: string };

export async function validateGiftCertificateCode(supabase: SupabaseAdmin, rawCode: string): Promise<GiftCertificateValidation> {
  const normalized = rawCode.trim();
  if (!normalized) return { valid: false, message: "No code provided." };

  const { data } = await supabase
    .from("gift_card_codes")
    .select("*")
    .ilike("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { valid: false, message: "We couldn’t validate that code. Please check it or continue with the required deposit." };
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { valid: false, message: "This gift certificate/code has expired." };
  }

  const usageCount = Number(data.usage_count ?? data.used_count ?? 0);
  const usageLimit = data.usage_limit == null ? (data.allow_reuse ? null : 1) : Number(data.usage_limit);

  if (usageLimit !== null && usageCount >= usageLimit) {
    return { valid: false, message: "This gift certificate/code has already been used." };
  }
  if (!data.allow_reuse && data.redeemed_at && usageLimit === 1) {
    return { valid: false, message: "This gift certificate/code has already been used." };
  }

  return { valid: true, code: data, usageCount, usageLimit };
}

export async function markGiftCertificateUsed({
  supabase,
  code,
  clientId,
  bookingId,
  usageCount,
  amountWaived
}: {
  supabase: SupabaseAdmin;
  code: Record<string, any>;
  clientId: string | null;
  bookingId: string;
  usageCount: number;
  amountWaived: number;
}) {
  const nextUsageCount = usageCount + 1;
  const balance = typeof code.balance_cents === "number" ? Math.max(0, code.balance_cents - amountWaived) : code.balance_cents;
  const now = new Date().toISOString();

  await supabase.from("gift_card_code_redemptions").insert({
    client_id: clientId,
    booking_id: bookingId,
    code: code.code,
    status: "accepted"
  });

  await supabase
    .from("gift_card_codes")
    .update({
      used_count: nextUsageCount,
      usage_count: nextUsageCount,
      redeemed_at: now,
      used_at: now,
      used_by_client_id: clientId,
      used_on_booking_id: bookingId,
      ...(typeof balance === "number" ? { balance_cents: balance } : {})
    })
    .eq("id", code.id);
}
