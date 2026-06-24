import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/ui/SettingsForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  let settings: Record<string, string | null> = {};
  try {
    const res = await supabase?.from("business_settings").select("*").eq("id", 1).maybeSingle();
    settings = (res?.data as Record<string, string | null>) ?? {};
  } catch { settings = {}; }

  return (
    <AdminShell title="Website Settings" eyebrow="Admin">
      <SettingsForm settings={settings} />
    </AdminShell>
  );
}
