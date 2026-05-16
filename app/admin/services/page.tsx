import { AdminShell } from "@/components/admin/AdminShell";
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

  return (
    <AdminShell title="Services & Pricing" eyebrow="Admin / Store">
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">
          <span className="card-title" style={{ fontSize: "1rem" }}>All Services ({services.length})</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {services.length === 0 ? (
            <p style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--grey-mid)" }}>No services yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Duration</th>
                  <th>Deposit</th>
                  <th>Intake</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      {s.description && <div style={{ fontSize: "0.72rem", color: "var(--grey-mid)" }}>{String(s.description).slice(0, 60)}</div>}
                    </td>
                    <td>{s.service_categories?.name || "—"}</td>
                    <td>{s.service_total ? `$${(s.service_total / 100).toFixed(0)}` : "—"}</td>
                    <td>{s.duration_minutes} min</td>
                    <td>{s.requires_deposit ? <span className="badge badge-amber">Required</span> : <span className="badge badge-grey">None</span>}</td>
                    <td>{s.requires_intake ? <span className="badge badge-pink">{s.intake_type || "Yes"}</span> : <span className="badge badge-grey">No</span>}</td>
                    <td>{s.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-grey">Hidden</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Categories ({categories.length})</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Category</th><th>Description</th><th>Order</th><th>Active</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td style={{ color: "var(--grey-mid)" }}>{String(c.description || "—")}</td>
                  <td>{c.sort_order}</td>
                  <td>{c.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-grey">Hidden</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
