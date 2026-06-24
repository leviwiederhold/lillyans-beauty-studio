import { formatDate, formatDateTime, fullName } from "@/lib/format";

type Row = Record<string, any>;

export function StatGrid({ stats }: { stats: { label: string; value: number | string }[] }) {
  return <section className="admin-stats">{stats.map((s) => <div className="admin-stat" key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>)}</section>;
}

export function DataTable({ title, rows, columns }: { title?: string; rows: Row[]; columns: { key: string; label: string; render?: (row: Row) => React.ReactNode }[] }) {
  return (
    <div className="admin-card">
      {title && <h2>{title}</h2>}
      {rows.length === 0 && <p className="admin-empty">No records yet.</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={String(row.id || i)}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "")}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

export const bookingColumns = [
  { key: "status", label: "Status" },
  { key: "service_type", label: "Service Type" },
  { key: "client", label: "Client", render: (r: Row) => r.clients ? fullName(r.clients) : r.client_name || r.name || "" },
  { key: "starts_at", label: "Date/Time", render: (r: Row) => formatDateTime(r.starts_at || r.created_at) },
  { key: "deposit_status", label: "Deposit" },
  { key: "remaining_balance", label: "Due In Person", render: (r: Row) => r.remaining_balance ? `$${(Number(r.remaining_balance) / 100).toFixed(2)}` : "" },
  { key: "gift_card_code", label: "Gift Card/Code" },
  { key: "waiver_reason", label: "Waiver" }
];

export const membershipColumns = [
  { key: "client", label: "Client", render: (r: Row) => r.clients ? fullName(r.clients) : r.client_name || "" },
  { key: "email", label: "Email", render: (r: Row) => r.clients?.email || r.email || "" },
  { key: "plan_name", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "start_date", label: "Start", render: (r: Row) => formatDate(r.start_date) },
  { key: "renewal_date", label: "Renewal", render: (r: Row) => formatDate(r.renewal_date) },
  { key: "payment_status", label: "Payment" }
];
