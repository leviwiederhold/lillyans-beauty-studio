import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { giftCardInquirySchema } from "@/lib/validation";
import { notifyAdmin, notifyClient } from "@/lib/notifications";

export async function POST(request: Request) {
  const parsed = giftCardInquirySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { website, ...data } = parsed.data;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const { error } = await supabase.from("gift_card_inquiries").insert({
    ...data,
    occasion_other: data.occasion === "Other" ? data.occasion_other || null : null,
    status: "new"
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const adminText = [
    "New gift card inquiry",
    "",
    `Purchaser: ${data.purchaser_name}`,
    `Purchaser email: ${data.purchaser_email}`,
    `Purchaser phone: ${data.purchaser_phone}`,
    `Recipient: ${data.recipient_name}`,
    `Amount requested: ${data.amount_requested}`,
    `Occasion: ${data.occasion}${data.occasion === "Other" ? ` - ${data.occasion_other}` : ""}`,
    `Preferred contact method: ${data.preferred_contact_method}`,
    `Message/note: ${data.message || "None"}`
  ].join("\n");

  let emailWarning: string | null = null;
  try {
    await notifyAdmin("New Lillyan's Beauty Studio gift card inquiry", adminText);
  } catch {
    emailWarning = "Your inquiry was saved, but the studio email notification could not be sent.";
  }

  try {
    await notifyClient(
      data.purchaser_email,
      "We received your Lillyan's Beauty Studio gift card inquiry",
      "Thank you for your gift card inquiry. Lilly will follow up personally to complete the gift card request."
    );
  } catch {
    emailWarning = emailWarning || "Your inquiry was saved, but the confirmation email could not be sent.";
  }

  return NextResponse.json({ ok: true, warning: emailWarning });
}
