import { NextResponse } from "next/server";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { upsertClientForUser } from "@/lib/auth/profile";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error") || url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (authError) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("next", next);
    login.searchParams.set("message", errorDescription || authError);
    return NextResponse.redirect(login);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", next);
      login.searchParams.set("message", "Signup is not configured correctly yet. Please contact the studio.");
      return NextResponse.redirect(login);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", next);
      login.searchParams.set("message", getAuthErrorMessage(error));
      return NextResponse.redirect(login);
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const result = await upsertClientForUser(data.user);
      if (result.error) {
        const login = new URL("/login", url.origin);
        login.searchParams.set("next", next);
        login.searchParams.set("message", result.error);
        return NextResponse.redirect(login);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
