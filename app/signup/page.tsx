"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSafeNextPath, isAccountPath } from "@/lib/auth-roles";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = getSafeNextPath(params.get("next"), "/account");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      const profile = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      }).then((res) => res.json()).catch(() => ({}));
      router.push(profile?.is_admin || profile?.role === "admin" ? isAccountPath(next) ? "/admin" : next : next);
      router.refresh();
      return;
    }
    setMessage("Account created. Check your email to confirm your address, then sign in.");
  }

  return (
    <main className="auth-page">
      <AuthHeader />
      <form className="auth-card" action={submit}>
        <p className="auth-eyebrow">Create Your Account</p>
        <h1>Create Account</h1>
        <p className="auth-copy">Create an account to book online and manage your appointments.</p>
        <p className="auth-notice">Sign in is required before booking or submitting service intake forms.</p>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a password" required minLength={6} /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></span></label>
        {message && <p className="admin-message">{message}</p>}
        <div className="auth-actions"><button className="btn-primary">Create Account</button><a className="btn-outline" href={`/login?next=${encodeURIComponent(next)}`}>Already Have an Account</a></div>
        <p className="auth-privacy">Your client account keeps booking and intake information connected to you securely.</p>
      </form>
    </main>
  );
}

function AuthHeader() {
  return <header className="auth-header"><Link href="/" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></Link><Link href="/" className="auth-link">Back to Site</Link></header>;
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}
