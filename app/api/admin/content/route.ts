import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { announcementSchema, cmsContentSchema, serviceSettingSchema } from "@/lib/validation";
import { audit } from "@/lib/logging";

const configs = {
  cms_content: cmsContentSchema,
  service_settings: serviceSettingSchema,
  announcements: announcementSchema
} as const;

export async function POST(request: Request) {
  const { user } = await requireAdmin();
  const { table, ...body } = await request.json();
  if (!(table in configs)) return NextResponse.json({ error: "Unsupported content table." }, { status: 400 });
  const parsed = configs[table as keyof typeof configs].safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const payload = table === "service_settings"
    ? { ...parsed.data, required_fields: typeof (parsed.data as any).required_fields === "string" ? (parsed.data as any).required_fields.split(",").map((x: string) => x.trim()).filter(Boolean) : [] }
    : parsed.data;
  const { data, error } = await supabase.from(table).upsert(payload as any).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(user.id, `${table}.upsert`, table, data.id, null, data);
  return NextResponse.json({ ok: true, record: data });
}
