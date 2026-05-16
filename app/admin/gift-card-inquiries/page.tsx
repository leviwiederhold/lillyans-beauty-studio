import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GiftCardInquiriesPage() {
  const { supabase } = await requireAdmin();
  const inquiries = await supabase?.from("gift_card_inquiries").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <AdminShell title="Gift Card Inquiries" eyebrow="Admin / Gift Card Inquiries">
      <DataTable rows={inquiries?.data || []} columns={[
        { key: "status", label: "Status" },
        { key: "purchaser_name", label: "Purchaser" },
        { key: "purchaser_email", label: "Email" },
        { key: "recipient_name", label: "Recipient" },
        { key: "amount_requested", label: "Amount" },
        { key: "occasion", label: "Occasion" },
        { key: "created_at", label: "Received", render: (row) => formatDateTime(row.created_at) },
        { key: "internal_notes", label: "Notes" }
      ]} />
    </AdminShell>
  );
}
