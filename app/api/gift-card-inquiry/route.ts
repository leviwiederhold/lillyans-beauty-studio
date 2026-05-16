import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notifications";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  occasion: z.string().min(1),
  occasion_detail: z.string().optional(),
  message: z.string().optional()
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });

  const { name, email, phone, occasion, occasion_detail, message } = parsed.data;

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from("contact_inquiries").insert({
      name,
      email,
      phone: phone || null,
      subject: "gift_card_inquiry",
      message: message || "",
      occasion,
      occasion_detail: occasion_detail || null
    });
    if (error) console.error("Gift card inquiry insert error:", error);
  }

  await notifyAdmin(
    `New Gift Card Inquiry — ${occasion}`,
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nOccasion: ${occasion}${occasion_detail ? ` (${occasion_detail})` : ""}\nMessage: ${message || "—"}`
  );

  return NextResponse.json({ ok: true });
}
