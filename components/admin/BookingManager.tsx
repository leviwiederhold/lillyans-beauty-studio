"use client";

import { useState } from "react";
import { DataTable, bookingColumns } from "@/components/admin/AdminDataViews";

export function BookingManager({ rows }: { rows: Record<string, any>[] }) {
  const [selected, setSelected] = useState(rows[0]?.id || "");
  const [message, setMessage] = useState("");

  async function update(fd: FormData) {
    setMessage("Saving...");
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    setMessage(res.ok ? "Booking updated. Refresh to see the latest table." : body.error || "Update failed.");
  }

  async function resendPaymentLink() {
    if (!selected) return;
    setMessage("Sending Square payment link...");
    const res = await fetch("/api/admin/bookings/payment-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: selected })
    });
    const body = await res.json();
    setMessage(res.ok ? "Payment link sent to client." : body.error || "Could not send payment link.");
  }

  return (
    <>
      <DataTable rows={rows} columns={bookingColumns} />
      <section className="admin-card">
        <h2>Manage Booking Request</h2>
        <form action={update}>
          <label>Booking<select name="booking_id" value={selected} onChange={(e) => setSelected(e.target.value)}>{rows.map((r) => <option key={r.id} value={r.id}>{r.service_type} - {r.client_name || r.clients?.email || r.email}</option>)}</select></label>
          <label>Status<select name="status"><option>pending</option><option>pending_admin_confirmation</option><option>confirmed</option><option>denied</option><option>completed</option><option>cancelled</option><option>no-show</option></select></label>
          <label>Deposit required<select name="deposit_required"><option value="true">true</option><option value="false">false</option></select></label>
          <label>Deposit status<input name="deposit_status" placeholder="pending, paid, waived..." /></label>
          <label>Deposit amount cents<input name="deposit_amount_cents" type="number" min="0" placeholder="2500" /></label>
          <label>Starts at<input name="starts_at" type="datetime-local" /></label>
          <label>Ends at<input name="ends_at" type="datetime-local" /></label>
          <label>Internal notes<textarea name="internal_notes" placeholder="Private admin-only notes"></textarea></label>
          {message && <p className="admin-message">{message}</p>}
          <button className="btn-primary">Save Booking</button>
          <button type="button" className="btn-outline" onClick={resendPaymentLink}>Resend Square Payment Link</button>
        </form>
      </section>
    </>
  );
}
