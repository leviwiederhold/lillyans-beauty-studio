import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const { supabase } = await requireAdmin();
  const [servicesRes, categoriesRes] = await Promise.all([
    supabase?.from("services").select("*, service_categories(name)").order("sort_order"),
    supabase?.from("service_categories").select("*").order("sort_order")
  ]);
  const services = servicesRes?.data || [];
  const categories = categoriesRes?.data || [];
  const groups = categories.length > 0
    ? categories.map((c) => ({
      name: c.name,
      rows: services.filter((s) => s.service_categories?.name === c.name || s.category_id === c.id)
    }))
    : [{ name: "Services", rows: services }];

  return (
    <AdminShell title="Services" eyebrow="Business">
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div className="filter-pill active">All</div>
        {categories.slice(0, 5).map((c) => <div className="filter-pill" key={c.id}>{c.name}</div>)}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" disabled><i className="ti ti-plus" style={{ fontSize: 13, marginRight: 5 }} />Add service</button>
      </div>
      <div className="card">
        {services.length === 0 ? (
          <EmptyState title="No services yet" subtitle="Services and durations will appear here after they are added." icon="scissors" />
        ) : (
          groups.map((group) => group.rows.length > 0 && (
            <div key={group.name}>
              <div style={{ padding: "10px 16px", background: "var(--admin-bg)", borderBottom: "1px solid var(--admin-border)", fontSize: 10, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink3)" }}>{group.name}</div>
              {group.rows.map((s) => (
                <div className="svc-table-row" key={s.id}>
                  <div className="svc-name-col">
                    <div className="svc-name">{s.name}</div>
                    <div className="svc-cat">
                      {s.duration_minutes || 60} min
                      {s.requires_deposit ? " · Deposit required" : ""}
                      {s.requires_intake ? " · Intake required" : ""}
                    </div>
                  </div>
                  <div className="svc-col price">{s.service_total ? `$${(Number(s.service_total) / 100).toFixed(0)}` : "—"}</div>
                  <div className={`toggle${s.is_active ? " on" : ""}`} style={{ margin: "0 8px" }} aria-label={s.is_active ? "Active" : "Inactive"} />
                  <div className="svc-actions">
                    <button className="icon-btn" aria-label="Edit service"><i className="ti ti-edit" /></button>
                    <button className="icon-btn" aria-label="Delete service"><i className="ti ti-trash" /></button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
