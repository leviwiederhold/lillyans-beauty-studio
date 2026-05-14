import { NextResponse } from "next/server";
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
    const { error } = supabase ? await supabase.auth.exchangeCodeForSession(code) : { error: new Error("Supabase is not configured.") };
    if (error) {
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", next);
      login.searchParams.set("message", error.message);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
