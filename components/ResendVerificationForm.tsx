"use client";

import { useState } from "react";

export function ResendVerificationForm({ nextPath }: { nextPath: string }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setIsSubmitting(true);
    setMessage("Sending verification email...");
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") || "").trim(),
        next: nextPath
      })
    });
    const data = await response.json().catch(() => ({}));
    setMessage(data.message || data.error || (response.ok ? "Verification email sent." : "Could not send verification email."));
    setIsSubmitting(false);
  }

  return (
    <form action={submit}>
      <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      {message && <p className="admin-message">{message}</p>}
      <div className="auth-actions">
        <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Resend verification email"}</button>
        <a className="btn-outline" href={`/login?next=${encodeURIComponent(nextPath)}`}>Back to Sign In</a>
      </div>
    </form>
  );
}
