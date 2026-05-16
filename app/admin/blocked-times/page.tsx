import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/AdminDataViews";
import { AdminForms } from "@/components/admin/AdminForms";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BlockedTimesPage() {
  const { supabase } = await requireAdmin();
  const [blocked, settings, gallery, codes, memberships] = await Promise.all([
    supabase?.from("blocked_times").select("*").order("starts_at", { ascending: false }).limit(200),
    supabase?.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    supabase?.from("gallery_items").select("*").limit(20),
    supabase?.from("gift_card_codes").select("*").limit(20),
    supabase?.from("memberships").select("*").limit(20)
  ]);
  return (
    <AdminShell title="Blocked Times" eyebrow="Admin / Blocked Times">
      <AdminForms settings={settings?.data} gallery={gallery?.data || []} codes={codes?.data || []} memberships={memberships?.data || []} />
      <DataTable title="Blocked Dates & Times" rows={blocked?.data || []} columns={[
        { key: "starts_at", label: "Starts", render: (row) => formatDateTime(row.starts_at) },
        { key: "ends_at", label: "Ends", render: (row) => formatDateTime(row.ends_at) },
        { key: "reason", label: "Reason" }
      ]} />
    </AdminShell>
  );
}
