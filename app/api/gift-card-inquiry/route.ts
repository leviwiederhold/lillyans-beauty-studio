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
  message: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// Renders the structured gift card details into a readable email body for Lilly.
function describeDetails(d: Record<string, unknown> | undefined): string {
  if (!d) return "";
  const lines: string[] = [];
  const purchaser = d.purchaser as Record<string, unknown> | undefined;
  const recipient = d.recipient as Record<string, unknown> | null | undefined;
  const shipping = d.shipping as Record<string, unknown> | null | undefined;
  lines.push(`For: ${d.recipient_type === "someone_else" ? "Someone else" : "Themselves"}`);
  if (purchaser) lines.push(`Purchaser: ${purchaser.name || "—"} · ${purchaser.email || "—"} · ${purchaser.phone || "—"}`);
  if (recipient) lines.push(`Recipient: ${recipient.name || "—"} · ${recipient.email || "—"} · ${recipient.phone || "—"}`);
  if (d.amount) lines.push(`Amount: ${d.amount}`);
  lines.push(`Delivery: ${d.delivery_method || "—"}`);
  if (shipping) lines.push(`Ship to: ${shipping.name || "—"}, ${shipping.street || "—"}, ${shipping.city || "—"}, ${shipping.state || "—"} ${shipping.zip || "—"}`);
  if (d.preferred_contact) lines.push(`Preferred contact: ${d.preferred_contact}`);
  if (d.notes) lines.push(`Notes: ${d.notes}`);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });

  const { name, email, phone, occasion, occasion_detail, message, details } = parsed.data;

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from("contact_inquiries").insert({
      name,
      email,
      phone: phone || null,
      subject: "gift_card_inquiry",
      message: message || "",
      occasion,
      occasion_detail: occasion_detail || null,
      details: details ?? null,
    });
    if (error) console.error("Gift card inquiry insert error:", error);
  }

  const detailBlock = describeDetails(details);
  await notifyAdmin(
    `New Gift Card Inquiry — ${occasion}`,
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nOccasion: ${occasion}${occasion_detail ? ` (${occasion_detail})` : ""}\nMessage: ${message || "—"}${detailBlock ? `\n\n— Gift card details —\n${detailBlock}` : ""}`
  );

  return NextResponse.json({ ok: true });
}
