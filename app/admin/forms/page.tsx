import { AdminShell } from "@/components/admin/AdminShell";
import { FilterableForms } from "@/components/admin/AdminInteractiveViews";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const { supabase } = await requireAdmin();
  const forms = await supabase?.from("intake_forms").select("*, clients(first_name,last_name,email,phone)").order("created_at", { ascending: false }).limit(300);

  return (
    <AdminShell title="Intake Forms" eyebrow="Records">
      <FilterableForms forms={forms?.data || []} />
    </AdminShell>
  );
}
