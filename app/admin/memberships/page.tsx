import { AdminShell } from "@/components/admin/AdminShell";
import { StatGrid } from "@/components/admin/AdminDataViews";
import { MembershipManager } from "@/components/admin/MembershipManager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const { supabase } = await requireAdmin();
  const memberships = await supabase?.from("memberships").select("*, clients(first_name,last_name,email,phone)").neq("status", "plan").order("next_billing_at", { nullsFirst: false });
  const rows = memberships?.data || [];

  return (
    <AdminShell title="Memberships" eyebrow="Admin / Memberships">
      <StatGrid stats={[
        { label: "Active", value: rows.filter((r) => r.status === "active" || r.is_active).length },
        { label: "Past Due", value: rows.filter((r) => r.payment_status === "past_due").length },
        { label: "Cancelled", value: rows.filter((r) => r.status === "cancelled" || r.status === "inactive").length },
        { label: "Pending Checkout", value: rows.filter((r) => r.status === "checkout_pending").length }
      ]} />
      <MembershipManager rows={rows} />
    </AdminShell>
  );
}
