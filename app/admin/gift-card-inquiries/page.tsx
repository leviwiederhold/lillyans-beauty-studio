import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GiftCardInquiriesPage() {
  const { supabase } = await requireAdmin();
  const res = await supabase
    ?.from("contact_inquiries")
    .select("*")
    .eq("subject", "gift_card_inquiry")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = res?.data || [];

  return (
    <AdminShell title="Gift Card Inquiries" eyebrow="Admin / Store">
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ fontSize: "1rem" }}>Inquiries ({rows.length})</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {rows.length === 0 ? (
            <p style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--grey-mid)" }}>No gift card inquiries yet.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Occasion</th><th>Delivery &amp; Details</th><th>Message</th><th>Received</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const d = (r.details || {}) as Record<string, unknown>;
                  const recipient = d.recipient as Record<string, unknown> | null | undefined;
                  const shipping = d.shipping as Record<string, unknown> | null | undefined;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{String(r.name || "—")}</td>
                      <td><a href={`mailto:${r.email}`} style={{ color: "var(--pink-dark)" }}>{String(r.email || "")}</a></td>
                      <td>{String(r.phone || "—")}</td>
                      <td>
                        <span className="badge badge-pink">{String(r.occasion || "—")}</span>
                        {r.occasion_detail && <div style={{ fontSize: "0.7rem", color: "var(--grey-mid)", marginTop: "0.2rem" }}>{String(r.occasion_detail)}</div>}
                      </td>
                      <td style={{ fontSize: "0.74rem", color: "var(--grey-mid)", maxWidth: 240 }}>
                        {d.delivery_method ? <div><strong>Delivery:</strong> {String(d.delivery_method)}</div> : null}
                        {d.amount ? <div><strong>Amount:</strong> {String(d.amount)}</div> : null}
                        {recipient ? <div><strong>For:</strong> {String(recipient.name || "—")}{recipient.email ? ` · ${String(recipient.email)}` : ""}{recipient.phone ? ` · ${String(recipient.phone)}` : ""}</div> : null}
                        {shipping ? <div><strong>Ship:</strong> {String(shipping.name || "")}, {String(shipping.street || "")}, {String(shipping.city || "")} {String(shipping.state || "")} {String(shipping.zip || "")}</div> : null}
                        {d.preferred_contact ? <div><strong>Contact via:</strong> {String(d.preferred_contact)}</div> : null}
                        {!d.delivery_method && !d.amount && !recipient && !shipping ? "—" : null}
                      </td>
                      <td style={{ maxWidth: 200, color: "var(--grey-mid)", fontSize: "0.78rem" }}>{String(r.message || "—")}</td>
                      <td>{formatDateTime(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
