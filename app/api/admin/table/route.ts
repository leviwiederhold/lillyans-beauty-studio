import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { availabilityRuleSchema, blockedTimeSchema, galleryItemSchema, membershipSchema, serviceSchema, waiverCodeSchema } from "@/lib/validation";

const configs = {
  gallery_items: galleryItemSchema,
  memberships: membershipSchema,
  gift_card_codes: waiverCodeSchema,
  services: serviceSchema,
  availability_rules: availabilityRuleSchema,
  blocked_times: blockedTimeSchema
} as const;

export async function POST(request: Request) {
  await requireAdmin();
  const { table, ...body } = await request.json();
  if (!(table in configs)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  const parsed = configs[table as keyof typeof configs].safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { error } = await supabase.from(table).insert(parsed.data as Record<string, unknown>);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
