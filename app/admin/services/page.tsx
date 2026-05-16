import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const { supabase } = await requireAdmin();

  if (!supabase) {
    return (
      <AdminShell title="Services" eyebrow="Admin / Services">
        <p className="admin-message">Supabase is not configured.</p>
      </AdminShell>
    );
  }

  const [services, categories] = await Promise.all([
    supabase.from("services").select("*, service_categories(name)").order("sort_order"),
    supabase.from("service_categories").select("*").eq("is_active", true).order("sort_order")
  ]);

  return (
    <AdminShell title="Services" eyebrow="Admin / Services">
      <p className="admin-message">Use Settings to add services. Existing services are listed here for quick review of price, duration, intake, deposit, and active status.</p>
      <DataTable title="Manage Services" rows={services.data || []} columns={[
          { key: "name", label: "Service" },
          { key: "category", label: "Category", render: (r) => r.service_categories?.name || "" },
          { key: "duration", label: "Duration", render: (r) => `${r.duration_minutes || 0} min` },
          { key: "price", label: "Price", render: (r) => r.service_total ? `$${(r.service_total / 100).toFixed(2)}` : "Not set" },
          { key: "intake", label: "Intake", render: (r) => r.requires_intake ? r.intake_type || "Required" : "No" },
          { key: "deposit", label: "Deposit", render: (r) => r.requires_deposit ? "Required" : "Default 20%" },
          { key: "active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" }
      ]} />
      {categories.data?.length === 0 && <p className="admin-message">No active service categories found.</p>}
    </AdminShell>
  );
}
