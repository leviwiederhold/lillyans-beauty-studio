import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { giftCardInquiryUpdateSchema } from "@/lib/validation";
import { audit } from "@/lib/logging";

export async function PATCH(request: Request) {
  const { user } = await requireAdmin();
  const parsed = giftCardInquiryUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { id, ...updates } = parsed.data;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const before = await supabase.from("gift_card_inquiries").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("gift_card_inquiries")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(user.id, "gift_card_inquiry.update", "gift_card_inquiries", id, before.data, data);
  return NextResponse.json({ ok: true, inquiry: data });
}
