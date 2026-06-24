import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, StatusBadge } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";
import { fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, string> = {
  glow: "$60/mo",
  radiance: "$130/mo",
  luminary: "$200/mo",
};

function initials(row: any) {
  const name = fullName(row.clients) || row.client_name || row.email || "Client";
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "C";
}

function planLabel(row: any) {
  const plan = String(row.plan_name || "Membership");
  const key = plan.toLowerCase();
  const price = key.includes("radiance") ? PLAN_PRICES.radiance : key.includes("luminary") ? PLAN_PRICES.luminary : key.includes("glow") ? PLAN_PRICES.glow : row.price_label;
  return `${plan}${price ? ` · ${price}` : ""}`;
}

export default async function MembershipsPage() {
  const { supabase } = await requireAdmin();
  const memberships = await supabase
    ?.from("memberships")
    .select("*, clients(first_name,last_name,email,phone)")
    .neq("status", "plan")
    .order("renewal_date");
  const rows = memberships?.data || [];
  const active = rows.filter((r) => r.status === "active" || r.is_active);
  const pastDue = rows.filter((r) => r.payment_status === "past_due");

  return (
    <AdminShell title="Memberships" eyebrow="Business">
      <div className="three-col" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-icon green"><i className="ti ti-crown" /></div><div className="stat-val">{active.length}</div><div className="stat-label">Active members</div></div>
        <div className="stat-card"><div className="stat-icon rose"><i className="ti ti-currency-dollar" /></div><div className="stat-val">Square</div><div className="stat-label">Membership payments</div></div>
        <div className="stat-card"><div className="stat-icon amber"><i className="ti ti-alert-circle" /></div><div className="stat-val">{pastDue.length}</div><div className="stat-label">Past due</div></div>
      </div>
      <div className="filter-row">
        <div className="filter-pill active">All</div>
        <div className="filter-pill">Glow</div>
        <div className="filter-pill">Radiance</div>
        <div className="filter-pill">Luminary</div>
        <div className="filter-pill">Past due</div>
        <div className="filter-pill">Cancelled</div>
      </div>
      <div className="card">
        <div className="card-hdr"><span className="card-hdr-title">Active Members</span></div>
        {rows.length === 0 ? (
          <EmptyState title="No memberships yet" subtitle="Paid Square memberships will appear here once activated." icon="crown" />
        ) : rows.map((row) => (
          <div className="member-row" key={row.id}>
            <div className="member-avatar">{initials(row)}</div>
            <div className="member-info">
              <div className="member-name">{fullName(row.clients) || row.client_name || row.email || "Client"}</div>
              <div className="member-plan">{planLabel(row)}</div>
            </div>
            <StatusBadge status={row.payment_status === "past_due" ? "past_due" : row.status || "active"} />
            <div className="member-renew" style={{ marginLeft: 12 }}>{row.renewal_date ? `Renews ${new Date(row.renewal_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Renewal TBD"}</div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
