"use client";

import { useState } from "react";
import { DataTable, membershipColumns } from "@/components/admin/AdminDataViews";

export function MembershipManager({ rows }: { rows: Record<string, any>[] }) {
  const [message, setMessage] = useState("");

  async function update(id: string, updates: Record<string, unknown>) {
    setMessage("Saving...");
    const res = await fetch("/api/admin/memberships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const body = await res.json();
    setMessage(res.ok ? "Membership updated. Refresh to see the latest table." : body.error || "Update failed.");
  }

  return (
    <>
      <DataTable rows={rows} columns={membershipColumns} />
      <section className="admin-card">
        <h2>Manage Memberships</h2>
        <div className="mini-list">
          {rows.map((row) => (
            <p key={row.id}>
              {row.plan_name} · {row.clients?.email || row.email || "No email"} · {row.status}
              <button className="admin-link-button" type="button" onClick={() => update(row.id, { status: "cancelled", is_active: false, payment_status: "cancelled", cancelled_at: new Date().toISOString() })}>Cancel</button>
              <button className="admin-link-button" type="button" onClick={() => update(row.id, { status: "inactive", is_active: false })}>Mark Inactive</button>
            </p>
          ))}
        </div>
        {message && <p className="admin-message">{message}</p>}
      </section>
    </>
  );
}
