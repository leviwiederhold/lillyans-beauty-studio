import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getSafeNextPath, isAccountPath, isAdminProfile } from "@/lib/auth-roles";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"), "/account");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase?.auth.exchangeCodeForSession(code) ?? { data: { user: null } };
    if (data.user) {
      const admin = createSupabaseAdminClient();
      if (admin) {
        const profile = await ensureProfileForUser(admin, data.user);
        const destination = isAdminProfile(profile) && isAccountPath(next) ? "/admin" : next;
        return NextResponse.redirect(new URL(destination, url.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
