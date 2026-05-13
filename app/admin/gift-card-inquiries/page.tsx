import { AdminShell } from "@/components/admin/AdminShell";
import { GiftCardInquiryManager } from "@/components/admin/GiftCardInquiryManager";
import { StatGrid } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function GiftCardInquiriesPage() {
  const { supabase } = await requireAdmin();
  const inquiries = await supabase?.from("gift_card_inquiries").select("*").order("created_at", { ascending: false }).limit(300);
  const rows = inquiries?.data || [];

  return (
    <AdminShell title="Gift Card Inquiries" eyebrow="Admin / Gift Cards">
      <StatGrid stats={[
        { label: "New", value: rows.filter((row) => row.status === "new").length },
        { label: "Contacted", value: rows.filter((row) => row.status === "contacted").length },
        { label: "Completed", value: rows.filter((row) => row.status === "completed").length },
        { label: "Cancelled", value: rows.filter((row) => row.status === "cancelled").length },
        { label: "Total", value: rows.length }
      ]} />
      <GiftCardInquiryManager rows={rows} />
    </AdminShell>
  );
}
