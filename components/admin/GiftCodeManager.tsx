"use client";

import { useState } from "react";

export function GiftCodeManager({ codes }: { codes: Record<string, any>[] }) {
  const [message, setMessage] = useState("");
  async function update(id: string, updates: Record<string, unknown>) {
    setMessage("Saving...");
    const res = await fetch("/api/admin/gift-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const body = await res.json();
    setMessage(res.ok ? "Gift code updated. Refresh to see latest state." : body.error || "Update failed.");
  }

  return (
    <div className="mini-list">
      {codes.map((code) => (
        <p key={code.id}>
          {code.code} · active: {String(code.is_active)} · reusable: {String(code.allow_reuse)} · used: {code.used_count || 0}
          <button className="admin-link-button" type="button" onClick={() => update(code.id, { is_active: false })}>Deactivate</button>
          <button className="admin-link-button" type="button" onClick={() => update(code.id, { redeemed_at: new Date().toISOString(), used_count: (code.used_count || 0) + 1 })}>Mark Redeemed</button>
        </p>
      ))}
      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
