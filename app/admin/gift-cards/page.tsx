import { AdminShell } from "@/components/admin/AdminShell";
import { Card, StatusBadge, EmptyState } from "@/components/admin/ui/components";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

export default async function GiftCardsPage() {
  const { supabase } = await requireAdmin();
  let inquiries: AnyRow[] = [];
  let codes: AnyRow[] = [];
  try {
    const [iq, cd] = await Promise.all([
      supabase?.from("contact_inquiries").select("*").eq("subject", "gift_card_inquiry").order("created_at", { ascending: false }).limit(200),
      supabase?.from("gift_card_codes").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    inquiries = (iq?.data as AnyRow[]) ?? [];
    codes = (cd?.data as AnyRow[]) ?? [];
  } catch { /* defensive */ }

  return (
    <AdminShell title="Gift Cards" eyebrow="Business">
      <Card title={`Inquiries (${inquiries.length})`} bodyPad={false}>
        {inquiries.length === 0 ? (
          <EmptyState icon="ti-gift" title={<>No gift card <em>inquiries</em></>} sub="Requests from the gift card page will appear here." />
        ) : inquiries.map((r) => {
          const d = (r.details || {}) as AnyRow;
          const recipient = d.recipient as AnyRow | null | undefined;
          const shipping = d.shipping as AnyRow | null | undefined;
          const delivery = String(d.delivery_method || "");
          const deliveryLabel = delivery === "ship" ? "Mail delivery" : delivery === "pickup" ? "Pickup in studio" : delivery === "email" ? "Email delivery" : "";
          const recipientName = recipient ? String(recipient.name || "") : "Self";
          return (
            <div key={String(r.id)} className="gc-row">
              <div className="gc-info">
                <div className="gc-name">{String(r.name || "—")} → {recipientName}</div>
                <div className="gc-detail">{[String(r.occasion || ""), deliveryLabel, String(r.email || "")].filter(Boolean).join(" · ")}</div>
                {shipping ? <div className="gc-detail" style={{ marginTop: 3 }}>{[shipping.street, shipping.city, shipping.state, shipping.zip].filter(Boolean).map(String).join(", ")}</div> : null}
                {r.message ? <div className="gc-detail" style={{ marginTop: 3, fontStyle: "italic" }}>&ldquo;{String(r.message)}&rdquo;</div> : null}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {d.amount ? <div className="gc-amount">{String(d.amount)}</div> : null}
                <div style={{ marginTop: 4 }}><StatusBadge status="new" label="New" /></div>
              </div>
            </div>
          );
        })}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Card title="Active Codes" bodyPad={false}>
          {codes.length === 0 ? (
            <EmptyState icon="ti-ticket" title={<>No codes <em>yet</em></>} sub="Gift card and no-deposit codes appear here." />
          ) : (
            <table className="data-table">
              <thead><tr><th>Code</th><th>Value</th><th>Recipient</th><th>Status</th></tr></thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={String(c.id)}>
                    <td><code style={{ fontSize: 12, background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>{String(c.code || "")}</code></td>
                    <td>{c.balance_cents ? `$${(Number(c.balance_cents) / 100).toFixed(0)}` : (c.description ? String(c.description) : "Deposit waiver")}</td>
                    <td>{String(c.recipient_email || "—")}</td>
                    <td><StatusBadge status={c.is_active ? "active" : "completed"} label={c.is_active ? "Active" : "Inactive"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
