import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false, message: "No code provided." });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ valid: false, message: "Service unavailable." });

  const { data } = await supabase
    .from("gift_card_codes")
    .select("id,code,is_active,allow_reuse,used_count,description")
    .ilike("code", code)
    .maybeSingle();

  if (!data) return NextResponse.json({ valid: false, message: "Code not found." });
  if (!data.is_active) return NextResponse.json({ valid: false, message: "This code is no longer active." });
  if (!data.allow_reuse && data.used_count > 0) return NextResponse.json({ valid: false, message: "This code has already been used." });

  return NextResponse.json({ valid: true, code_id: data.id, message: data.description || "Code applied — deposit waived." });
}
