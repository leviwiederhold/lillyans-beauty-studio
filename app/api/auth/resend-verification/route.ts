import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getAuthCallbackUrl, getSafeNextPath } from "@/lib/auth/redirect";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const next = getSafeNextPath(typeof body.next === "string" ? body.next : null, "/book");

  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Signup is not configured correctly yet. Please contact the studio." }, { status: 500 });
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(next, origin)
    }
  });

  if (error) return NextResponse.json({ error: getAuthErrorMessage(error) }, { status: error.status || 400 });
  return NextResponse.json({ message: "Verification email sent. Check your inbox for a new link." });
}
