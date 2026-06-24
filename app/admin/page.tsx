import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Card, ApptRow, StatusBadge } from "@/components/admin/ui/components";
import { requireAdmin } from "@/lib/admin";
import { fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

async function safe<T>(q: PromiseLike<T> | undefined): Promise<{ data: AnyRow[]; count: number }> {
  if (!q) return { data: [], count: 0 };
  try {
    const r = (await q) as { data?: AnyRow[] | null; count?: number | null };
    return { data: r?.data ?? [], count: r?.count ?? 0 };
  } catch {
    return { data: [], count: 0 };
  }
}

function timeLabel(iso: unknown) {
  if (!iso) return "";
  return new Date(String(iso)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function dayLabel(iso: unknown) {
  if (!iso) return "";
  return new Date(String(iso)).toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}
function dot(status: string): "confirmed" | "pending" | "new" {
  if (status === "confirmed" || status === "completed") return "confirmed";
  if (status === "pending" || status === "pending_admin_confirmation") return "pending";
  return "new";
}
function clientName(b: AnyRow) {
  return (b.clients ? fullName(b.clients as AnyRow) : "") || String(b.client_name || "Guest");
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8).toISOString();

  const [today, week, deposits, members, forms, inquiries] = await Promise.all([
    safe(supabase?.from("bookings").select("*, clients(first_name,last_name,email)").gte("starts_at", startOfToday).lt("starts_at", endOfToday).order("starts_at")),
    safe(supabase?.from("bookings").select("*, clients(first_name,last_name,email)").gte("starts_at", endOfToday).lt("starts_at", endOfWeek).order("starts_at").limit(6)),
    safe(supabase?.from("bookings").select("id, client_name, service_type, starts_at, deposit_status").eq("deposit_required", true).in("deposit_status", ["pending", "payment_link_sent", "payment_link_pending"]).order("starts_at").limit(6)),
    safe(supabase?.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active")),
    safe(supabase?.from("client_forms").select("id", { count: "exact", head: true }).eq("reviewed", false)),
    safe(supabase?.from("contact_inquiries").select("name, subject, created_at").order("created_at", { ascending: false }).limit(3)),
  ]);

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <AdminShell title="Overview" hidePageHeader>
      <div className="page-hdr">
        <div className="page-eyebrow">{dateStr}</div>
        <div className="page-title">{greeting}, <em>Lilly</em></div>
        <div className="page-sub">
          You have {today.data.length} appointment{today.data.length === 1 ? "" : "s"} today
          {deposits.data.length > 0 ? ` and ${deposits.data.length} item${deposits.data.length === 1 ? "" : "s"} needing attention.` : "."}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard tone="rose" icon="ti-calendar-event" value={today.data.length} label="Today's appointments" href="/admin/calendar" />
        <StatCard tone="amber" icon="ti-clock-exclamation" value={deposits.data.length} label="Pending deposits" href="/admin/bookings" />
        <StatCard tone="green" icon="ti-crown" value={members.count} label="Active memberships" href="/admin/memberships" />
        <StatCard tone="blue" icon="ti-clipboard-list" value={forms.count} label="Forms needing review" href="/admin/client-forms" />
      </div>

      <div className="two-col">
        <div className="col-stack">
          <Card title="Today's Schedule" action="View calendar" actionHref="/admin/calendar">
            {today.data.length === 0
              ? <p className="appt-svc">No appointments scheduled today.</p>
              : today.data.map((b) => (
                <ApptRow key={String(b.id)} time={timeLabel(b.starts_at)} dot={dot(String(b.status))}
                  name={clientName(b)} svc={String(b.service_type || "")}
                  badge={<StatusBadge status={String(b.status)} />} />
              ))}
          </Card>
          <Card title="Upcoming This Week" action="All bookings" actionHref="/admin/bookings">
            {week.data.length === 0
              ? <p className="appt-svc">Nothing else booked this week.</p>
              : week.data.map((b) => (
                <ApptRow key={String(b.id)} time={dayLabel(b.starts_at)} dot={dot(String(b.status))}
                  name={clientName(b)} svc={`${String(b.service_type || "")} · ${timeLabel(b.starts_at)}`} />
              ))}
          </Card>
        </div>

        <div className="col-stack">
          <Card title="Quick Actions">
            <div className="qa-grid">
              <a className="qa-btn" href="/admin/bookings"><i className="ti ti-calendar-plus" />Add booking</a>
              <a className="qa-btn" href="/admin/clients"><i className="ti ti-user-plus" />Add client</a>
              <a className="qa-btn" href="/admin/blocked-times"><i className="ti ti-ban" />Block time</a>
              <a className="qa-btn" href="/admin/business-hours"><i className="ti ti-clock" />Edit hours</a>
              <a className="qa-btn" href="/admin/services"><i className="ti ti-plus" />Add service</a>
              <a className="qa-btn" href="/admin/gift-card-inquiries"><i className="ti ti-gift" />Gift cards</a>
            </div>
          </Card>
          <Card title="Needs Attention" bodyPad={false}>
            <div style={{ padding: "8px 16px" }}>
              {deposits.data.length === 0 && inquiries.data.length === 0 && (
                <p className="appt-svc" style={{ padding: "8px 0" }}>You&apos;re all caught up. ✨</p>
              )}
              {deposits.data.slice(0, 3).map((b) => (
                <ApptRow key={String(b.id)} dot="pending" name={`${String(b.client_name || "Client")} — deposit due`}
                  svc={`${String(b.service_type || "")} · ${b.starts_at ? new Date(String(b.starts_at)).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}`}
                  badge={<StatusBadge status="pending" label="Pending" />} />
              ))}
              {inquiries.data.slice(0, 2).map((q, i) => (
                <ApptRow key={i} dot="new" name={`${String(q.name || "New inquiry")}`}
                  svc={String(q.subject || "").replace(/_/g, " ")} badge={<StatusBadge status="new" label="New" />} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
