"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl, getSafeNextPath } from "@/lib/auth/redirect";

function ClientLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = getSafeNextPath(params.get("next"));
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");

  async function submit(fd: FormData) {
    setMessage("Working...");
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthCallbackUrl(next, window.location.origin) }
      });
    if (result.error) {
      setMessage(result.error.message.includes("Email not confirmed") ? "Please confirm your email address before signing in." : result.error.message);
      return;
    }
    if (mode === "signup" && result.data.user && Array.isArray(result.data.user.identities) && result.data.user.identities.length === 0) {
      setMessage("An account with this email already exists. Please sign in instead.");
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm your address, then sign in.");
      return;
    }
    await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (mode === "signup" || mode === "login") {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <main className="admin-shell login-shell">
      <form className="admin-card login-card" action={submit}>
        <h1>Client Account</h1>
        <p>Log in to view your profile, intake forms, booking requests, membership status, and gift card/code history.</p>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        {message && <p className="admin-message">{message}</p>}
        <button className="btn-primary">{mode === "login" ? "Log In" : "Create Account"}</button>
        <button type="button" className="btn-outline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create Account" : "Use Existing Account"}</button>
      </form>
    </main>
  );
}

export default function ClientLoginPage() {
  return <Suspense><ClientLoginForm /></Suspense>;
}
