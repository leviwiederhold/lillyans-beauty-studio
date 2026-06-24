"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookingRescheduleForm({ bookingId, depositStatus }: { bookingId: string; depositStatus?: string | null }) {
  const router = useRouter();
  const [startsAt, setStartsAt] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const hasCarryover = ["paid", "waived", "paid_via_credit"].includes(String(depositStatus || ""));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startsAt) return;
    setSaving(true);
    setMessage("Checking availability...");
    const localDate = new Date(startsAt);
    const res = await fetch("/api/account/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, starts_at: localDate.toISOString() })
    });
    const body = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage(body.message || "Booking rescheduled.");
      router.refresh();
    } else {
      setMessage(body.error || "Could not reschedule this booking.");
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem", maxWidth: 340 }}>
      <label style={{ fontSize: "0.72rem", color: "var(--grey-mid)" }}>
        Request a new time
        <input
          className="field-input"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          style={{ marginTop: "0.3rem" }}
        />
      </label>
      {hasCarryover && (
        <p style={{ fontSize: "0.72rem", color: "var(--grey-mid)" }}>
          Your original deposit will be applied to your rescheduled appointment.
        </p>
      )}
      <button className="btn btn-outline btn-sm" type="submit" disabled={saving || !startsAt}>
        {saving ? "Saving..." : "Reschedule"}
      </button>
      {message && <p style={{ fontSize: "0.72rem", color: "var(--grey-mid)" }}>{message}</p>}
    </form>
  );
}
