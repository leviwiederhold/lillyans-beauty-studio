"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Sending...");
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/reset-password`,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setSent(true);
    setMessage("");
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" className="nav-logo">
          Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span>
        </Link>
        <Link href="/login" className="auth-link">Back to Sign In</Link>
      </header>

      {sent ? (
        <div className="auth-card">
          <p className="auth-eyebrow">Check Your Email</p>
          <h1>Reset Link Sent</h1>
          <p className="auth-copy">
            We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the
            link to set a new password.
          </p>
          <p className="auth-copy" style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              className="auth-link"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              onClick={() => setSent(false)}
            >
              try again
            </button>
            .
          </p>
          <div className="auth-actions">
            <Link href="/login" className="btn-outline">Back to Sign In</Link>
          </div>
        </div>
      ) : (
        <form className="auth-card" onSubmit={submit}>
          <p className="auth-eyebrow">Account Recovery</p>
          <h1>Forgot Password?</h1>
          <p className="auth-copy">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          {message && <p className="admin-message">{message}</p>}
          <div className="auth-actions">
            <button className="btn-primary" type="submit">Send Reset Link</button>
            <Link href="/login" className="btn-outline">Cancel</Link>
          </div>
        </form>
      )}
    </main>
  );
}

export default function ForgotPasswordPage() {
  return <Suspense><ForgotPasswordForm /></Suspense>;
}
