import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const settings = await supabase?.from("business_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <AdminShell title="Website Settings" eyebrow="Admin">
      <AdminSettingsForm settings={settings?.data} />
    </AdminShell>
  );
}
