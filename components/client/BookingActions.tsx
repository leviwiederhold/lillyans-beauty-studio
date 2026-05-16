"use client";

import { useState } from "react";

export function BookingActions({ booking }: { booking: Record<string, any> }) {
  const [message, setMessage] = useState("");
  const canRequestChange = ["pending", "pending_admin_confirmation", "confirmed"].includes(String(booking.status));

  async function requestChange(action: "cancel_requested" | "reschedule_requested") {
    setMessage("Saving request...");
    const res = await fetch("/api/account/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: booking.id, action })
    });
    const body = await res.json();
    setMessage(res.ok ? "Request saved. Lilly will review it soon." : body.error || "Could not save request.");
  }

  if (!canRequestChange) return null;

  return (
    <div className="client-inline-actions">
      <button type="button" className="admin-link-button" onClick={() => requestChange("reschedule_requested")}>Request Reschedule</button>
      <button type="button" className="admin-link-button" onClick={() => requestChange("cancel_requested")}>Request Cancel</button>
      {message && <span>{message}</span>}
    </div>
  );
}
