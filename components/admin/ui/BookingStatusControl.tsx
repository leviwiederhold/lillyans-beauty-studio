"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "pending_admin_confirmation", "confirmed", "completed", "cancelled", "denied", "no-show"];
const CLASS: Record<string, string> = {
  confirmed: "confirmed", completed: "completed", pending: "pending",
  pending_admin_confirmation: "pending", cancelled: "cancelled", denied: "cancelled", "no-show": "cancelled",
};

// Inline status badge that expands to a dropdown and PATCHes the booking.
export function BookingStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(status);

  async function change(next: string) {
    setValue(next); setSaving(true);
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: id, status: next }),
    });
    setSaving(false); setEditing(false);
    if (res.ok) router.refresh();
  }

  if (editing) {
    return (
      <select
        className="f-input"
        style={{ padding: "4px 8px", fontSize: 12, width: "auto" }}
        value={value}
        disabled={saving}
        autoFocus
        onBlur={() => setEditing(false)}
        onChange={(e) => change(e.target.value)}
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
      </select>
    );
  }

  return (
    <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} title="Click to change status">
      <span className={`badge ${CLASS[value] || "completed"}`}>{value.replace(/_/g, " ")}</span>
    </button>
  );
}
