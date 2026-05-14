"use client";

import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getAuthCallbackUrl, getSafeNextPath } from "@/lib/auth/redirect";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = getSafeNextPath(params.get("next"));
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Creating account...");
    setIsSubmitting(true);
    const fd = new FormData(event.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthCallbackUrl(next, window.location.origin);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });
      if (error) {
        setMessage(getAuthErrorMessage(error));
        return;
      }
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setMessage("An account with this email already exists. Please sign in instead.");
        return;
      }
      if (data.session) {
        const profileRes = await fetch("/api/account/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (!profileRes.ok) {
          const profileData = await profileRes.json().catch(() => ({}));
          setMessage(profileData.error || "Your account was created, but your profile could not be synced. Please try signing in again.");
          return;
        }
        router.push(next);
        router.refresh();
        return;
      }
      setMessage("Account created. Check your email to confirm your address, then sign in.");
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
        <p className="auth-eyebrow">Create Your Account</p>
        <h1>Create Account</h1>
        <p className="auth-copy">Create an account to book online and manage your appointments.</p>
        <p className="auth-notice">Sign in is required before booking or submitting service intake forms.</p>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a password" required minLength={6} /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></span></label>
        {message && <p className="admin-message">{message}</p>}
        <div className="auth-actions"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Account"}</button><a className="btn-outline" href={`/login?next=${encodeURIComponent(next)}`}>Already Have an Account</a></div>
        <p className="auth-privacy">Your client account keeps booking and intake information connected to you securely.</p>
      </form>
    </main>
  );
}

function AuthHeader() {
  return <header className="auth-header"><Link href="/" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></Link><Link href="/" className="auth-link">Back to Site</Link></header>;
}

export default function SignupPage() {
  return <Suspense fallback={<main className="auth-page"><AuthHeader /></main>}><SignupForm /></Suspense>;
}
