import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/AdminDataViews";
import { AdminForms } from "@/components/admin/AdminForms";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function BusinessHoursPage() {
  const { supabase } = await requireAdmin();
  const [settings, gallery, codes, memberships, hours] = await Promise.all([
    supabase?.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    supabase?.from("gallery_items").select("*").order("sort_order").limit(20),
    supabase?.from("gift_card_codes").select("*").limit(20),
    supabase?.from("memberships").select("*").limit(20),
    supabase?.from("business_hours").select("*").order("day_of_week")
  ]);

  return (
    <AdminShell title="Business Hours" eyebrow="Admin / Business Hours">
      <AdminForms settings={settings?.data} gallery={gallery?.data || []} codes={codes?.data || []} memberships={memberships?.data || []} hours={hours?.data || []} />
      <DataTable title="Current Hours" rows={hours?.data || []} columns={[
        { key: "day_of_week", label: "Day" },
        { key: "opens_at", label: "Opens" },
        { key: "closes_at", label: "Closes" },
        { key: "is_closed", label: "Closed", render: (row) => row.is_closed ? "Yes" : "No" }
      ]} />
    </AdminShell>
  );
}
