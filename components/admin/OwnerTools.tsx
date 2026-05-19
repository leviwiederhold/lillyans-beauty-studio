"use client";

import { useState } from "react";

export function OwnerTools({ duplicatePairs }: { duplicatePairs: { primary: unknown; duplicate: unknown }[] }) {
  const [message, setMessage] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideOpen, setOverrideOpen] = useState("");
  const [overrideClose, setOverrideClose] = useState("");
  const [overrideClosed, setOverrideClosed] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  async function post(url: string, fd: FormData, method = "POST") {
    setMessage("Saving...");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd.entries())) });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Saved." : body.error || "Request failed.");
  }

  async function blockTime() {
    if (!blockStart || !blockEnd) { setMessage("Start and end are required."); return; }
    setMessage("Saving...");
    const res = await fetch("/api/admin/blocked-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starts_at: blockStart, ends_at: blockEnd, reason: blockReason || null }),
    });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Time blocked." : body.error || "Could not block time.");
    if (res.ok) { setBlockStart(""); setBlockEnd(""); setBlockReason(""); }
  }

  async function saveOverride() {
    if (!overrideDate) { setMessage("Date is required."); return; }
    setMessage("Saving...");
    const res = await fetch("/api/admin/date-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        override_date: overrideDate,
        opens_at: overrideClosed ? null : overrideOpen || null,
        closes_at: overrideClosed ? null : overrideClose || null,
        is_closed: overrideClosed,
        reason: overrideReason || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Special hours saved." : body.error || "Could not save.");
    if (res.ok) { setOverrideDate(""); setOverrideOpen(""); setOverrideClose(""); setOverrideClosed(false); setOverrideReason(""); }
  }

  const pairs = duplicatePairs as Array<{ primary: Record<string, unknown>; duplicate: Record<string, unknown> }>;

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

      {/* Block Time */}
      <div className="admin-card">
        <h2>Block Time / Vacation</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "0.75rem" }}>
          Blocked times will not appear as available to clients.
        </p>
        <label>
          Start
          <input type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
        </label>
        <label>
          End
          <input type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
        </label>
        <label>
          Reason (optional)
          <input
            type="text"
            placeholder="e.g. Vacation, Lunch, Personal"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
        </label>
        <button className="btn-primary" onClick={blockTime}>Block This Time</button>
      </div>

      {/* Special Date Hours */}
      <div className="admin-card">
        <h2>Special Hours / Day Off</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "0.75rem" }}>
          Override hours for a specific date (e.g. holiday, early close).
        </p>
        <label>
          Date
          <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={overrideClosed}
            onChange={(e) => setOverrideClosed(e.target.checked)}
            style={{ width: "auto" }}
          />
          Closed all day
        </label>
        {!overrideClosed && (
          <>
            <label>
              Opens at
              <input type="time" value={overrideOpen} onChange={(e) => setOverrideOpen(e.target.value)} />
            </label>
            <label>
              Closes at
              <input type="time" value={overrideClose} onChange={(e) => setOverrideClose(e.target.value)} />
            </label>
          </>
        )}
        <label>
          Reason (optional)
          <input
            type="text"
            placeholder="e.g. Holiday, Training"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />
        </label>
        <button className="btn-primary" onClick={saveOverride}>Save Special Hours</button>
      </div>

      <div className="admin-card">
        <h2>Duplicate Client Detection</h2>
        {pairs.length === 0 && <p className="admin-empty">No likely duplicates found.</p>}
        {pairs.map((pair) => (
          <form key={`${String(pair.primary.id)}-${String(pair.duplicate.id)}`} action={(fd) => post("/api/admin/clients", fd, "PATCH")} className="merge-row">
            <input type="hidden" name="primary_client_id" value={String(pair.primary.id)} />
            <input type="hidden" name="duplicate_client_id" value={String(pair.duplicate.id)} />
            <p>{String(pair.primary.email || pair.primary.phone || "")} matches {String(pair.duplicate.email || pair.duplicate.phone || "")}</p>
            <button className="btn-outline">Merge</button>
          </form>
        ))}
      </div>
      <div className="admin-card">
        <h2>Export Data</h2>
        {["clients", "bookings", "client_forms", "contact_inquiries", "memberships"].map((table) => <p key={table}><a className="admin-link-button" href={`/api/admin/export?table=${table}`}>Export {table}.csv</a></p>)}
      </div>
      {message && <p className="admin-message">{message}</p>}
    </section>
  );
}
