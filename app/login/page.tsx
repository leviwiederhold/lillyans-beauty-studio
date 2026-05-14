"use client";

import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/redirect";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = getSafeNextPath(params.get("next"));
  const [message, setMessage] = useState(params.get("message") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Signing in...");
    setIsSubmitting(true);
    const fd = new FormData(event.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(getAuthErrorMessage(error));
        return;
      }
      const profileRes = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!profileRes.ok) {
        const profileData = await profileRes.json().catch(() => ({}));
        setMessage(profileData.error || "You signed in, but your profile could not be synced. Please try again.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthHeader />
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-eyebrow">Welcome Back</p>
        <h1>Client Sign In</h1>
        <p className="auth-copy">Sign in to book online, complete intake forms, and view your appointments.</p>
        <p className="auth-notice">Sign in is required before booking or submitting service intake forms.</p>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Your password" required /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></span></label>
        <a className="auth-link" href={`mailto:lillyansbeautystudio@gmail.com?subject=Password help`}>Forgot your password?</a>
        {message && <p className="admin-message">{message}</p>}
        <div className="auth-actions"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Signing In..." : "Sign In"}</button><a className="btn-outline" href={`/signup?next=${encodeURIComponent(next)}`}>Create Account</a></div>
        <p className="auth-privacy">Your client account keeps booking and intake information connected to you securely.</p>
      </form>
    </main>
  );
}

function AuthHeader() {
  return <header className="auth-header"><Link href="/" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></Link><Link href="/" className="auth-link">Back to Site</Link></header>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page"><AuthHeader /></main>}><LoginForm /></Suspense>;
}
