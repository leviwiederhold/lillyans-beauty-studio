import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { GiftCodeManager } from "@/components/admin/GiftCodeManager";

export const dynamic = "force-dynamic";

export default async function GiftCardCodesPage() {
  const { supabase } = await requireAdmin();
  const codesRes = await supabase?.from("gift_card_codes").select("*").order("created_at", { ascending: false }).limit(200);
  const codes = codesRes?.data || [];

  return (
    <AdminShell title="Gift Card Codes" eyebrow="Admin / Store">
      <GiftCodeManager codes={codes} />
    </AdminShell>
  );
}
