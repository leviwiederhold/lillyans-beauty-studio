import { AdminShell } from "@/components/admin/AdminShell";
import { AdminForms } from "@/components/admin/AdminForms";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function GiftCodesAdminPage() {
  const { supabase } = await requireAdmin();
  const [settings, gallery, codes, memberships] = await Promise.all([
    supabase?.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    supabase?.from("gallery_items").select("*").order("sort_order").limit(100),
    supabase?.from("gift_card_codes").select("*").order("created_at", { ascending: false }).limit(100),
    supabase?.from("memberships").select("*").order("sort_order").limit(100)
  ]);

  return (
    <AdminShell title="Gift Card / No-Deposit Codes" eyebrow="Admin / Gift Codes">
      <AdminForms settings={settings?.data} gallery={gallery?.data || []} codes={codes?.data || []} memberships={memberships?.data || []} />
    </AdminShell>
  );
}
