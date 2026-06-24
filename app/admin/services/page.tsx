import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/ui/components";
import { ServiceToggle } from "@/components/admin/ui/ServiceToggle";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

export default async function AdminServicesPage() {
  const { supabase } = await requireAdmin();
  let services: AnyRow[] = [];
  try {
    const res = await supabase?.from("services").select("*, service_categories(name)").order("sort_order");
    services = (res?.data as AnyRow[]) ?? [];
  } catch { services = []; }

  // Group by category, preserving order.
  const groups = new Map<string, AnyRow[]>();
  for (const s of services) {
    const cat = String((s.service_categories as AnyRow)?.name || "Other");
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(s);
  }

  function price(s: AnyRow) {
    const cents = Number(s.service_total || 0);
    return cents ? `$${(cents / 100).toFixed(0)}` : "—";
  }
  function meta(s: AnyRow) {
    const bits = [s.duration_minutes ? `${s.duration_minutes} min` : ""];
    if (s.requires_deposit) bits.push("Deposit required");
    if (s.requires_intake) bits.push("Intake required");
    return bits.filter(Boolean).join(" · ");
  }

  return (
    <AdminShell title="Services" eyebrow="Business">
      {services.length === 0 ? (
        <div className="card"><EmptyState icon="ti-scissors" title={<>No services <em>yet</em></>} sub="Add services to make them bookable." /></div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {[...groups.entries()].map(([cat, items]) => (
            <div key={cat}>
              <div className="svc-group-label">{cat}</div>
              {items.map((s) => (
                <div key={String(s.id)} className="svc-table-row">
                  <div className="svc-name-col">
                    <div className="svc-name">{String(s.name || "")}</div>
                    <div className="svc-cat">{meta(s)}</div>
                  </div>
                  <div className="svc-col price">{price(s)}</div>
                  <ServiceToggle id={String(s.id)} active={!!s.is_active} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
