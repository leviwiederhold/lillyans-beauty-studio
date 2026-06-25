import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Card, StatusBadge, EmptyState, initialsOf } from "@/components/admin/ui/components";
import { requireAdmin } from "@/lib/admin";
import { fullName, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

export default async function MembershipsPage() {
  const { supabase } = await requireAdmin();
  let rows: AnyRow[] = [];
  try {
    const res = await supabase
      ?.from("memberships")
      .select("*, clients(first_name,last_name,email,phone)")
      .neq("status", "plan")
      .order("renewal_date");
    rows = (res?.data as AnyRow[]) ?? [];
  } catch {
    rows = [];
  }

  const active = rows.filter((r) => r.status === "active" || r.is_active);
  const pastDue = rows.filter((r) => r.payment_status === "past_due" || r.status === "past_due");
  const monthly = active.reduce((sum, r) => sum + (Number(r.price_cents || 0) / 100), 0);

  function name(r: AnyRow) {
    return (r.clients ? fullName(r.clients as AnyRow) : "") || String(r.client_name || r.name || "Member");
  }

  return (
    <AdminShell title="Memberships" eyebrow="Business">
      <div className="three-col" style={{ marginBottom: 20 }}>
        <StatCard tone="green" icon="ti-crown" value={active.length} label="Active members" />
        <StatCard tone="rose" icon="ti-currency-dollar" value={`$${monthly.toFixed(0)}`} label="Monthly recurring" />
        <StatCard tone="amber" icon="ti-alert-circle" value={pastDue.length} label="Past due" />
      </div>

      <Card title="Members" bodyPad={false}>
        {rows.length === 0
          ? <EmptyState icon="ti-crown" title={<>No members <em>yet</em></>} sub="Active subscriptions will appear here." />
          : rows.map((r) => (
            <div key={String(r.id)} className="member-row">
              <div className="member-avatar">{initialsOf(name(r), String((r.clients as AnyRow)?.email || r.email || ""))}</div>
              <div className="member-info">
                <div className="member-name">{name(r)}</div>
                <div className="member-plan">
                  {String(r.plan_name || "Membership")}
                  {r.price_cents ? ` · $${(Number(r.price_cents) / 100).toFixed(0)}/mo` : ""}
                </div>
              </div>
              <StatusBadge status={String(r.payment_status === "past_due" ? "past_due" : r.status || "")} label={r.payment_status === "past_due" ? "Past due" : String(r.status || "")} />
              {r.renewal_date ? <div className="member-renew" style={{ marginLeft: 12 }}>Renews {formatDate(r.renewal_date)}</div> : null}
            </div>
          ))}
      </Card>
    </AdminShell>
  );
}
