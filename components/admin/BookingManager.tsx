"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, bookingColumns } from "@/components/admin/AdminDataViews";

export function BookingManager({ rows }: { rows: Record<string, any>[] }) {
  const router = useRouter();
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
    if (res.ok) {
      setMessage("Booking updated.");
      router.refresh();
    } else {
      setMessage(body.error || "Update failed.");
    }
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
      <section className="card">
        <div className="card-hdr"><span className="card-hdr-title">Manage Booking Request</span></div>
        <div className="card-body">
        <form action={update}>
          <div className="f-row"><label className="f-label">Booking</label><select className="f-input f-select" name="booking_id" value={selected} onChange={(e) => setSelected(e.target.value)}>{rows.map((r) => <option key={r.id} value={r.id}>{r.service_type} - {r.client_name || r.clients?.email || r.email}</option>)}</select></div>
          <div className="f-grid2">
            <div className="f-row"><label className="f-label">Status</label><select className="f-input f-select" name="status"><option>pending</option><option>pending_admin_confirmation</option><option>confirmed</option><option>denied</option><option>completed</option><option>cancelled</option><option>no-show</option></select></div>
            <div className="f-row"><label className="f-label">Deposit required</label><select className="f-input f-select" name="deposit_required"><option value="true">true</option><option value="false">false</option></select></div>
          </div>
          <div className="f-grid2">
            <div className="f-row"><label className="f-label">Deposit status</label><input className="f-input" name="deposit_status" placeholder="pending, paid, waived..." /></div>
            <div className="f-row"><label className="f-label">20% deposit cents</label><input className="f-input" name="deposit_amount_cents" type="number" min="0" placeholder="2500" /></div>
          </div>
          <div className="f-grid2">
            <div className="f-row"><label className="f-label">Starts at</label><input className="f-input" name="starts_at" type="datetime-local" /></div>
            <div className="f-row"><label className="f-label">Ends at</label><input className="f-input" name="ends_at" type="datetime-local" /></div>
          </div>
          <div className="f-row"><label className="f-label">Internal notes</label><textarea className="f-input f-textarea" name="internal_notes" placeholder="Private admin-only notes"></textarea></div>
          {message && <p className="admin-message">{message}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary">Save booking</button>
            <button type="button" className="btn btn-secondary" onClick={resendPaymentLink}>Resend Square payment link</button>
          </div>
        </form>
        </div>
      </section>
    </>
  );
}
