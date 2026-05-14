import { NextResponse } from "next/server";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { upsertClientForUser } from "@/lib/auth/profile";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error");
  const authErrorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");
  const next = getSafeNextPath(url.searchParams.get("next"), "/book");

  if (authError || authErrorCode) {
    const target = new URL("/auth/verify-error", url.origin);
    target.searchParams.set("next", next);
    target.searchParams.set("code", authErrorCode || authError || "");
    target.searchParams.set("message", getAuthErrorMessage({ code: authErrorCode || authError || "", message: errorDescription || authErrorCode || authError || "" }));
    return NextResponse.redirect(target);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      const target = new URL("/auth/verify-error", url.origin);
      target.searchParams.set("next", next);
      target.searchParams.set("message", "Signup is not configured correctly yet. Please contact the studio.");
      return NextResponse.redirect(target);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const target = new URL("/auth/verify-error", url.origin);
      target.searchParams.set("next", next);
      target.searchParams.set("message", getAuthErrorMessage(error));
      return NextResponse.redirect(target);
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const result = await upsertClientForUser(data.user);
      if (result.error) {
        const target = new URL("/auth/verify-error", url.origin);
        target.searchParams.set("next", next);
        target.searchParams.set("message", result.error);
        return NextResponse.redirect(target);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
