import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), "/account");
  const authError = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (authError) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("next", next);
    login.searchParams.set("message", authError);
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
