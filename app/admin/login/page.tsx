"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Signing in...");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="admin-shell login-shell">
      <form className="admin-card login-card" onSubmit={login}>
        <h1>Lillyan&apos;s Admin</h1>
        <p>Sign in to manage inquiries, intake forms, hours, gallery, codes, and memberships.</p>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        {message && <p className="admin-message">{message}</p>}
        <button className="btn-primary">Sign In</button>
      </form>
    </main>
  );
}
