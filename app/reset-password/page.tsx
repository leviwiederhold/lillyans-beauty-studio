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

  // Supabase sends the session via URL hash — exchange it so auth.updateUser works
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
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
        </header>
        <div className="auth-card">
          <p className="auth-eyebrow">Account Recovery</p>
          <h1>Reset Password</h1>
          <p className="auth-copy">Verifying your reset link…</p>
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
