import { AdminShell } from "@/components/admin/AdminShell";
import { Card, StatusBadge, EmptyState } from "@/components/admin/ui/components";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

export default async function GiftCardInquiriesPage() {
  const { supabase } = await requireAdmin();
  let rows: AnyRow[] = [];
  try {
    const res = await supabase
      ?.from("contact_inquiries")
      .select("*")
      .eq("subject", "gift_card_inquiry")
      .order("created_at", { ascending: false })
      .limit(200);
    rows = (res?.data as AnyRow[]) ?? [];
  } catch {
    rows = [];
  }

  return (
    <AdminShell title="Gift Cards" eyebrow="Business">
      <Card title={`Inquiries (${rows.length})`} bodyPad={false}>
        {rows.length === 0 ? (
          <EmptyState icon="ti-gift" title={<>No gift card <em>inquiries</em></>} sub="Requests from the gift card page will appear here." />
        ) : (
          rows.map((r) => {
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
                  <div className="gc-detail">
                    {[String(r.occasion || ""), deliveryLabel, String(r.email || "")].filter(Boolean).join(" · ")}
                  </div>
                  {shipping ? (
                    <div className="gc-detail" style={{ marginTop: 3 }}>
                      {[shipping.street, shipping.city, shipping.state, shipping.zip].filter(Boolean).map(String).join(", ")}
                    </div>
                  ) : null}
                  {r.message ? <div className="gc-detail" style={{ marginTop: 3, fontStyle: "italic" }}>&ldquo;{String(r.message)}&rdquo;</div> : null}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {d.amount ? <div className="gc-amount">{String(d.amount)}</div> : null}
                  <div style={{ marginTop: 4 }}><StatusBadge status="new" label="New" /></div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </AdminShell>
  );
}
