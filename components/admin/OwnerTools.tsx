"use client";

import { useState } from "react";

export function OwnerTools({ duplicatePairs }: { duplicatePairs: { primary: any; duplicate: any }[] }) {
  const [message, setMessage] = useState("");
  async function post(url: string, fd: FormData, method = "POST") {
    setMessage("Saving...");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd.entries())) });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Saved. Refresh to see updates." : body.error || "Request failed.");
  }
  return (
    <section className="admin-grid">
      <div className="admin-card">
        <h2>Create Client</h2>
        <form action={(fd) => post("/api/admin/clients", fd)}>
          <label>First name<input name="first_name" required /></label>
          <label>Last name<input name="last_name" /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Phone<input name="phone" /></label>
          <label>Address<input name="address" /></label>
          <button className="btn-primary">Create Client</button>
        </form>
      </div>
      <div className="admin-card">
        <h2>Create Booking</h2>
        <form action={(fd) => post("/api/admin/bookings", fd)}>
          <label>Client ID<input name="client_id" /></label>
          <label>Client name<input name="client_name" /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Phone<input name="phone" /></label>
          <label>Service type<input name="service_type" required /></label>
          <label>Starts at<input name="starts_at" type="datetime-local" /></label>
          <label>Ends at<input name="ends_at" type="datetime-local" /></label>
          <label>Status<select name="status"><option>confirmed</option><option>pending</option></select></label>
          <button className="btn-primary">Create Booking</button>
        </form>
      </div>
      <div className="admin-card">
        <h2>Duplicate Client Detection</h2>
        {duplicatePairs.length === 0 && <p className="admin-empty">No likely duplicates found.</p>}
        {duplicatePairs.map((pair) => (
          <form key={`${pair.primary.id}-${pair.duplicate.id}`} action={(fd) => post("/api/admin/clients", fd, "PATCH")} className="merge-row">
            <input type="hidden" name="primary_client_id" value={pair.primary.id} />
            <input type="hidden" name="duplicate_client_id" value={pair.duplicate.id} />
            <p>{pair.primary.email || pair.primary.phone} matches {pair.duplicate.email || pair.duplicate.phone}</p>
            <button className="btn-outline">Merge</button>
          </form>
        ))}
      </div>
      <div className="admin-card">
        <h2>Export Data</h2>
        {["clients", "bookings", "intake_forms", "contact_inquiries", "memberships"].map((table) => <p key={table}><a className="admin-link-button" href={`/api/admin/export?table=${table}`}>Export {table}.csv</a></p>)}
      </div>
      {message && <p className="admin-message">{message}</p>}
    </section>
  );
}
