import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, StatusBadge } from "@/components/admin/AdminDataViews";
import { GiftCodeManager } from "@/components/admin/GiftCodeManager";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

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
      <div className="page-hdr">
        <div className="page-eyebrow">Business</div>
        <div className="page-title">Gift <em>Cards</em></div>
        <div className="page-sub">Manage gift card inquiries, no-deposit codes, and redemption status.</div>
      </div>
      <div className="two-col">
        <DataTable title="Gift Card Inquiries" rows={inquiries} columns={[
          { key: "purchaser_name", label: "Purchaser" },
          { key: "recipient_name", label: "Recipient" },
          { key: "amount_requested", label: "Amount" },
          { key: "occasion", label: "Occasion" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status || "new"} /> },
          { key: "created_at", label: "Received", render: (r) => formatDateTime(r.created_at) }
        ]} />
        <div className="card">
          <div className="card-hdr"><span className="card-hdr-title">Gift Card / No-Deposit Codes</span></div>
          <div className="card-body">
            <GiftCodeManager codes={codes} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
