"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState(false);

  // Supabase delivers the recovery session via the URL (PKCE ?code= or legacy #hash).
  // The browser client auto-exchanges it on init, firing an auth event. We must handle
  // three cases robustly:
  //  1. The event fires AFTER our listener attaches (PASSWORD_RECOVERY / SIGNED_IN).
  //  2. The event already fired BEFORE we attached (race) — caught by getSession().
  //  3. The link is invalid/expired — no session ever appears; show an error.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION"))) {
        resolved = true;
        setReady(true);
      }
    });

    // Catch the race: the recovery session may already be established before the
    // listener above was registered.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true;
        setReady(true);
      }
    });

    // Fallback: if no recovery session materializes, the link is invalid or expired.
    const timer = setTimeout(() => {
      if (!resolved) setLinkError(true);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setMessage("Passwords do not match."); return; }
    if (password.length < 8) { setMessage("Password must be at least 8 characters."); return; }
    setMessage("Updating password...");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage(error.message); return; }
    setMessage("Password updated! Redirecting...");
    setTimeout(() => router.push("/account"), 1500);
  }

  if (!ready) {
    return (
      <main className="auth-page">
        <header className="auth-header">
          <Link href="/" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></Link>
          <Link href="/login" className="auth-link">Back to Sign In</Link>
        </header>
        <div className="auth-card">
          <p className="auth-eyebrow">Account Recovery</p>
          <h1>Reset Password</h1>
          {linkError ? (
            <>
              <p className="auth-copy">
                This password reset link is invalid or has expired. Reset links can only be used
                once and expire after a short time.
              </p>
              <div className="auth-actions">
                <Link href="/forgot-password" className="btn-primary">Request a New Link</Link>
                <Link href="/login" className="btn-outline">Back to Sign In</Link>
              </div>
            </>
          ) : (
            <p className="auth-copy">Verifying your reset link…</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></Link>
        <Link href="/login" className="auth-link">Back to Sign In</Link>
      </header>
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-eyebrow">Account Recovery</p>
        <h1>Set New Password</h1>
        <p className="auth-copy">Choose a new password for your account.</p>
        <label>
          New Password
          <span className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        <label>
          Confirm Password
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            required
          />
        </label>
        {message && <p className="admin-message">{message}</p>}
        <div className="auth-actions">
          <button className="btn-primary" type="submit">Update Password</button>
        </div>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
