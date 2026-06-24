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
      {codes.map((code) => {
        const usageCount = code.usage_count ?? code.used_count ?? 0;
        const usageLimit = code.usage_limit ?? (code.allow_reuse ? "unlimited" : 1);
        return (
        <p key={code.id}>
          {code.code} · {code.type || "gift_certificate"} · active: {String(code.is_active)} · used: {usageCount}/{usageLimit}
          {code.value_cents ? ` · value: $${(Number(code.value_cents) / 100).toFixed(2)}` : ""}
          {code.expires_at ? ` · expires: ${new Date(code.expires_at).toLocaleDateString()}` : ""}
          {code.used_on_booking_id ? ` · booking: ${code.used_on_booking_id}` : ""}
          <button className="admin-link-button" type="button" onClick={() => update(code.id, { is_active: false })}>Deactivate</button>
          <button className="admin-link-button" type="button" onClick={() => update(code.id, { redeemed_at: new Date().toISOString(), used_at: new Date().toISOString(), used_count: Number(usageCount) + 1, usage_count: Number(usageCount) + 1 })}>Mark Redeemed</button>
        </p>
        );
      })}
      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
