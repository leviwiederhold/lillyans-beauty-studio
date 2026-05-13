"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";

type Row = Record<string, any>;

export function GiftCardInquiryManager({ rows }: { rows: Row[] }) {
  const [openId, setOpenId] = useState<string | null>(rows[0]?.id || null);
  const [message, setMessage] = useState("");

  async function update(formData: FormData) {
    setMessage("Saving...");
    const response = await fetch("/api/admin/gift-card-inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    setMessage(response.ok ? "Inquiry updated." : "Could not update inquiry.");
  }

  return (
    <section className="admin-card">
      <h2>Gift Card Inquiries</h2>
      {message && <p className="admin-message">{message}</p>}
      {rows.length === 0 && <p className="admin-empty">No gift card inquiries yet.</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Received</th><th>Purchaser</th><th>Recipient</th><th>Amount</th><th>Occasion</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDateTime(row.created_at)}</td>
              <td>{row.purchaser_name}<br />{row.purchaser_email}<br />{row.purchaser_phone}</td>
              <td>{row.recipient_name}</td>
              <td>{row.amount_requested}</td>
              <td>{row.occasion}{row.occasion_other ? ` - ${row.occasion_other}` : ""}</td>
              <td>{row.status}</td>
              <td><button className="admin-link-button" onClick={() => setOpenId(openId === row.id ? null : row.id)}>View</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.map((row) => openId === row.id && (
        <form key={row.id} className="admin-detail-form" action={update}>
          <input type="hidden" name="id" value={row.id} />
          <h3>{row.purchaser_name} for {row.recipient_name}</h3>
          <p><strong>Preferred contact:</strong> {row.preferred_contact_method}</p>
          <p><strong>Message:</strong> {row.message || "None"}</p>
          <div className="form-row">
            <label>Status<select name="status" defaultValue={row.status}><option value="new">new</option><option value="contacted">contacted</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select></label>
            <label>Internal notes<textarea name="internal_notes" defaultValue={row.internal_notes || ""} /></label>
          </div>
          <button className="btn-primary">Update Inquiry</button>
        </form>
      ))}
    </section>
  );
}
