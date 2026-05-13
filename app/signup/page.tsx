"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [message, setMessage] = useState("");

  async function submit(fd: FormData) {
    setMessage("Creating account...");
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      setMessage(error.message.includes("already registered") ? "An account with this email already exists. Please sign in instead." : error.message);
      return;
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setMessage("An account with this email already exists. Please sign in instead.");
      return;
    }
    if (data.session) {
      await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      router.push(next);
      router.refresh();
      return;
    }
    setMessage("Account created. Check your email to confirm your address, then sign in.");
  }

  return (
    <main className="admin-shell login-shell">
      <form className="admin-card login-card" action={submit}>
        <h1>Create Account</h1>
        <p>Create an account to book online and manage your appointments.</p>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required minLength={6} /></label>
        {message && <p className="admin-message">{message}</p>}
        <button className="btn-primary">Create Account</button>
        <a className="btn-outline" href={`/login?next=${encodeURIComponent(next)}`}>Already Have an Account</a>
      </form>
    </main>
  );
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}
