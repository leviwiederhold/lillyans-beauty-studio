"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function ClientLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");

  async function submit(fd: FormData) {
    setMessage("Working...");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup") setMessage("Account created. Check your email if confirmation is required.");
    else {
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
