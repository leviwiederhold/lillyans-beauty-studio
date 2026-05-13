"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [message, setMessage] = useState("");

  async function submit(fd: FormData) {
    setMessage("Signing in...");
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message.includes("Email not confirmed") ? "Please confirm your email address before signing in." : error.message);
      return;
    }
    await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    router.push(next);
    router.refresh();
  }

  return (
    <main className="admin-shell login-shell">
      <form className="admin-card login-card" action={submit}>
        <h1>Client Sign In</h1>
        <p>Sign in to book online and view your appointments.</p>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        {message && <p className="admin-message">{message}</p>}
        <button className="btn-primary">Sign In</button>
        <a className="btn-outline" href={`/signup?next=${encodeURIComponent(next)}`}>Create Account</a>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
