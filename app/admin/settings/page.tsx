import { AdminShell } from "@/components/admin/AdminShell";
import { AdminForms } from "@/components/admin/AdminForms";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [settings, gallery, codes, memberships, hours] = await Promise.all([
    supabase?.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    supabase?.from("gallery_items").select("*").order("sort_order").limit(100),
    supabase?.from("gift_card_codes").select("*").order("created_at", { ascending: false }).limit(100),
    supabase?.from("memberships").select("*").order("sort_order").limit(100),
    supabase?.from("business_hours").select("*").order("day_of_week")
  ]);

  return (
    <AdminShell title="Settings" eyebrow="Admin / Settings">
      <AdminForms settings={settings?.data} gallery={gallery?.data || []} codes={codes?.data || []} memberships={memberships?.data || []} hours={hours?.data || []} />
    </AdminShell>
  );
}
