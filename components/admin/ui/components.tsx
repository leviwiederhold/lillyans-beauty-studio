import Link from "next/link";
import type { ReactNode } from "react";

/* ── Page header ─────────────────────────────────────────────────────────── */
export function PageHeader({ eyebrow, title, sub }: { eyebrow?: string; title: ReactNode; sub?: string }) {
  return (
    <div className="page-hdr">
      {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
      <div className="page-title">{title}</div>
      {sub && <div className="page-sub">{sub}</div>}
    </div>
  );
}

/* ── Stat cards ──────────────────────────────────────────────────────────── */
type StatTone = "rose" | "green" | "amber" | "blue";
export function StatCard({ icon, value, label, delta, tone = "rose", href }: { icon: string; value: ReactNode; label: string; delta?: string; tone?: StatTone; href?: string }) {
  const inner = (
    <>
      <div className={`stat-icon ${tone}`}><i className={`ti ${icon}`} /></div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      {delta && <div className="stat-delta"><i className="ti ti-arrow-up" style={{ fontSize: 10 }} />{delta}</div>}
    </>
  );
  return href ? <Link href={href} className="stat-card">{inner}</Link> : <div className="stat-card">{inner}</div>;
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 }) {
  return <div className={cols === 3 ? "three-col" : "stat-grid"} style={cols === 3 ? { marginBottom: 20 } : undefined}>{children}</div>;
}

/* ── Card ────────────────────────────────────────────────────────────────── */
export function Card({ title, action, actionHref, children, bodyPad = true }: { title?: string; action?: string; actionHref?: string; children: ReactNode; bodyPad?: boolean }) {
  return (
    <div className="card">
      {title && (
        <div className="card-hdr">
          <span className="card-hdr-title">{title}</span>
          {action && actionHref && <Link href={actionHref} className="card-hdr-action">{action}</Link>}
        </div>
      )}
      {bodyPad ? <div className="card-body">{children}</div> : children}
    </div>
  );
}

/* ── Status badge ────────────────────────────────────────────────────────── */
const STATUS_CLASS: Record<string, string> = {
  confirmed: "confirmed", paid: "confirmed", current: "active", active: "active", "on file": "active",
  pending: "pending", pending_admin_confirmation: "pending", due: "pending", "deposit due": "pending",
  cancelled: "cancelled", denied: "cancelled", "no-show": "cancelled", past_due: "cancelled",
  completed: "completed",
  new: "new",
  review: "review", "needs review": "review",
  missing: "missing",
  outdated: "outdated",
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = (status || "").toLowerCase();
  const cls = STATUS_CLASS[key] ?? "completed";
  return <span className={`badge ${cls}`}>{label ?? status}</span>;
}

/* ── Appointment row ─────────────────────────────────────────────────────── */
export function ApptRow({ time, dot = "confirmed", name, svc, dur, badge }: { time?: string; dot?: "confirmed" | "pending" | "new"; name: string; svc?: string; dur?: string; badge?: ReactNode }) {
  return (
    <div className="appt-row">
      {time && <div className="appt-time">{time}</div>}
      <div className={`appt-dot ${dot}`} />
      <div className="appt-info">
        <div className="appt-name">{name}</div>
        {svc && <div className="appt-svc">{svc}</div>}
      </div>
      {dur && <div className="appt-dur">{dur}</div>}
      {badge}
    </div>
  );
}

/* ── Data table ──────────────────────────────────────────────────────────── */
export type Row = Record<string, unknown>;
export type Column = { key: string; label: string; render?: (row: Row) => ReactNode };
export function DataTable({ columns, rows, empty = "No records yet." }: { columns: Column[]; rows: Row[]; empty?: string }) {
  if (rows.length === 0) {
    return <div className="card"><div className="empty-state"><i className="ti ti-inbox" /><div className="empty-title">Nothing here <em>yet</em></div><div className="empty-sub">{empty}</div></div></div>;
  }
  return (
    <div className="card">
      <table className="data-table">
        <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String((row.id as string) || i)}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Filter pills (link-based, ?filter=) ─────────────────────────────────── */
export function FilterPills({ options, active, basePath, param = "filter", rightSlot }: { options: { value: string; label: string }[]; active: string; basePath: string; param?: string; rightSlot?: ReactNode }) {
  return (
    <div className="filter-row">
      {options.map((o) => {
        const isActive = (active || options[0]?.value) === o.value;
        const href = o.value === options[0]?.value ? basePath : `${basePath}?${param}=${encodeURIComponent(o.value)}`;
        return <Link key={o.value} href={href} className={`filter-pill${isActive ? " active" : ""}`}>{o.label}</Link>;
      })}
      {rightSlot && <><div className="filter-spacer" />{rightSlot}</>}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon = "ti-inbox", title, sub }: { icon?: string; title: ReactNode; sub?: string }) {
  return <div className="empty-state"><i className={`ti ${icon}`} /><div className="empty-title">{title}</div>{sub && <div className="empty-sub">{sub}</div>}</div>;
}

/* ── avatar initials helper ──────────────────────────────────────────────── */
export function initialsOf(name: string, email?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (email?.[0] || "?").toUpperCase();
}
