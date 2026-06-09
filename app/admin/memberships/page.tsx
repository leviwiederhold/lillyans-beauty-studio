import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, membershipColumns, StatGrid } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const { supabase } = await requireAdmin();
  // Exclude plan-definition rows (status='plan'); show only real client subscriptions.
  const memberships = await supabase
    ?.from("memberships")
    .select("*, clients(first_name,last_name,email,phone)")
    .neq("status", "plan")
    .order("renewal_date");
  const rows = memberships?.data || [];

  return (
    <AdminShell title="Active Memberships" eyebrow="Admin / Memberships">
      <StatGrid stats={[
        { label: "Active", value: rows.filter((r) => r.status === "active" || r.is_active).length },
        { label: "Past Due", value: rows.filter((r) => r.payment_status === "past_due").length },
        { label: "Paused", value: rows.filter((r) => r.status === "paused").length }
      ]} />
      <DataTable rows={rows} columns={membershipColumns} />
    </AdminShell>
  );
}
