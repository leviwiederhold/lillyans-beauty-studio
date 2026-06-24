import { formatDate, formatDateTime, fullName } from "@/lib/format";

type Row = Record<string, any>;

const STAT_COLORS = ["rose", "amber", "green", "blue"];
const STAT_ICONS = ["calendar-event", "clock-exclamation", "crown", "clipboard-list", "users"];

export function StatGrid({ stats }: { stats: { label: string; value: number | string; delta?: string }[] }) {
  return (
    <section className="stat-grid">
      {stats.map((s, index) => (
        <div className="stat-card" key={s.label}>
          <div className={`stat-icon ${STAT_COLORS[index % STAT_COLORS.length]}`}><i className={`ti ti-${STAT_ICONS[index % STAT_ICONS.length]}`} /></div>
          <div className="stat-val">{s.value}</div>
          <div className="stat-label">{s.label}</div>
          {s.delta && <div className="stat-delta"><i className="ti ti-arrow-up" />{s.delta}</div>}
        </div>
      ))}
    </section>
  );
}

export function DataTable({ title, rows, columns }: { title?: string; rows: Row[]; columns: { key: string; label: string; render?: (row: Row) => React.ReactNode }[] }) {
  return (
    <div className="card">
      {title && <div className="card-hdr"><span className="card-hdr-title">{title}</span></div>}
      {rows.length === 0 ? (
        <EmptyState title="No records yet" icon="inbox" />
      ) : (
      <div className="admin-table-wrap">
        <table className="data-table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={String(row.id || i)}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "")}</td>)}</tr>)}</tbody>
        </table>
      </div>
      )}
    </div>
  );
}

export function EmptyState({ title, subtitle = "Live data will appear here as soon as it is available.", icon = "sparkles" }: { title: string; subtitle?: string; icon?: string }) {
  return <div className="empty-state"><i className={`ti ti-${icon}`} /><div className="empty-title">{title}</div><div className="empty-sub">{subtitle}</div></div>;
}

export function StatusBadge({ status }: { status?: string | null }) {
  const value = String(status || "new");
  const cls = value.includes("paid") || value === "confirmed" || value === "active" ? "confirmed" : value.includes("cancel") || value === "denied" ? "cancelled" : value.includes("complete") ? "completed" : value.includes("review") ? "review" : value.includes("missing") ? "missing" : value.includes("new") ? "new" : "pending";
  return <span className={`badge ${cls}`}>{value.replaceAll("_", " ")}</span>;
}

export function AppointmentList({ title, rows, actionHref }: { title: string; rows: Row[]; actionHref?: string }) {
  return (
    <div className="card">
      <div className="card-hdr"><span className="card-hdr-title">{title}</span>{actionHref && <a className="card-hdr-action" href={actionHref}>View all</a>}</div>
      <div className="card-body">
        {rows.length === 0 ? <EmptyState title="No appointments" icon="calendar-event" /> : rows.map((row) => {
          const date = row.starts_at ? new Date(String(row.starts_at)) : null;
          return (
            <div className="appt-row" key={String(row.id)}>
              <div className="appt-time">{date ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "TBD"}</div>
              <div className={`appt-dot ${row.status === "confirmed" ? "confirmed" : row.status === "pending" ? "pending" : "new"}`} />
              <div className="appt-info"><div className="appt-name">{row.client_name || fullName(row.clients) || row.email || "Client"}</div><div className="appt-svc">{row.service_type || row.subject || "Appointment"}</div></div>
              <div className="appt-dur">{row.ends_at && row.starts_at ? `${Math.max(15, Math.round((new Date(String(row.ends_at)).getTime() - new Date(String(row.starts_at)).getTime()) / 60000))} min` : ""}</div>
              <StatusBadge status={row.deposit_status === "paid" ? "paid" : row.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const bookingColumns = [
  { key: "status", label: "Status" },
  { key: "service_type", label: "Service Type" },
  { key: "client", label: "Client", render: (r: Row) => r.clients ? fullName(r.clients) : r.client_name || r.name || "" },
  { key: "starts_at", label: "Date/Time", render: (r: Row) => formatDateTime(r.starts_at || r.created_at) },
  { key: "deposit_status", label: "Deposit", render: (r: Row) => <StatusBadge status={r.deposit_status} /> },
  { key: "remaining_balance", label: "Due In Person", render: (r: Row) => r.remaining_balance ? `$${(Number(r.remaining_balance) / 100).toFixed(2)}` : "" },
  { key: "gift_card_code", label: "Gift Card/Code" },
  { key: "status_badge", label: "Status", render: (r: Row) => <StatusBadge status={r.status} /> }
];

export const membershipColumns = [
  { key: "client", label: "Client", render: (r: Row) => r.clients ? fullName(r.clients) : r.client_name || "" },
  { key: "email", label: "Email", render: (r: Row) => r.clients?.email || r.email || "" },
  { key: "plan_name", label: "Plan" },
  { key: "status", label: "Status", render: (r: Row) => <StatusBadge status={r.status} /> },
  { key: "start_date", label: "Start", render: (r: Row) => formatDate(r.start_date) },
  { key: "renewal_date", label: "Renewal", render: (r: Row) => formatDate(r.renewal_date) },
  { key: "payment_status", label: "Payment" }
];
