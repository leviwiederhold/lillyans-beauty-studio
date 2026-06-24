import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, StatusBadge } from "@/components/admin/AdminDataViews";
import { GiftCodeManager } from "@/components/admin/GiftCodeManager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function GiftCardsPage() {
  const { supabase } = await requireAdmin();
  const [inquiriesRes, codesRes] = await Promise.all([
    supabase?.from("gift_card_inquiries").select("*").order("created_at", { ascending: false }).limit(100),
    supabase?.from("gift_card_codes").select("*").order("created_at", { ascending: false }).limit(200)
  ]);
  const inquiries = inquiriesRes?.data || [];
  const codes = codesRes?.data || [];

  return (
    <AdminShell title="Gift Cards" eyebrow="Business">
      <div className="filter-row">
        <div className="filter-pill active">All</div>
        <div className="filter-pill">New</div>
        <div className="filter-pill">Contacted</div>
        <div className="filter-pill">Completed</div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" disabled><i className="ti ti-plus" style={{ fontSize: 13, marginRight: 5 }} />Create code</button>
      </div>
      <div className="card">
        {inquiries.length === 0 ? (
          <EmptyState title="No gift card inquiries" subtitle="New public gift card inquiries will appear here." icon="gift" />
        ) : inquiries.map((inquiry) => (
          <div className="gc-row" key={inquiry.id}>
            <div className="gc-info">
              <div className="gc-name">{inquiry.purchaser_name || "Purchaser"} → {inquiry.recipient_name || "Recipient"}</div>
              <div className="gc-detail">{inquiry.occasion || "Gift card"} · {inquiry.preferred_contact_method || "Contact"} · {inquiry.purchaser_email}</div>
              {inquiry.message && <div className="gc-detail" style={{ marginTop: 3, fontStyle: "italic", color: "var(--ink3)" }}>&quot;{inquiry.message}&quot;</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="gc-amount">{inquiry.amount_requested || "—"}</div>
              <StatusBadge status={inquiry.status || "new"} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }} className="card">
        <div className="card-hdr"><span className="card-hdr-title">Active Codes</span><button className="card-hdr-action" disabled>+ Create</button></div>
        <div className="card-body">
          <GiftCodeManager codes={codes} />
        </div>
      </div>
    </AdminShell>
  );
}
