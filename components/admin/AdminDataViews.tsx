"use client";

import { useMemo, useState } from "react";
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

export function SearchableClients({ clients }: { clients: Row[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter((c) => [fullName(c), c.email, c.phone, c.membership_status, c.services_used].join(" ").toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <div className="admin-card">
      <div className="admin-card-head"><h2>Clients & Accounts</h2><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients..." /></div>
      <DataTable rows={filtered} columns={[
        { key: "name", label: "Name", render: (r) => fullName(r) },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "services_used", label: "Services Used", render: (r) => (r.services_used || []).join(", ") },
        { key: "intake_count", label: "Intake Forms" },
        { key: "booking_count", label: "Bookings" },
        { key: "membership_status", label: "Membership" }
      ]} />
    </div>
  );
}

export function FilterableForms({ forms }: { forms: Row[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const types = Array.from(new Set(forms.map((f) => f.type).filter(Boolean)));
  const filtered = forms.filter((f) => {
    const client = f.clients || {};
    const haystack = [f.type, f.service_label, f.signature, client.first_name, client.last_name, client.email, client.phone].join(" ").toLowerCase();
    return (!type || f.type === type) && haystack.includes(query.toLowerCase());
  });

  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2>Intake Forms</h2>
        <div className="admin-controls"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by client..." /><select value={type} onChange={(e) => setType(e.target.value)}><option value="">All service types</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Client</th><th>Service</th><th>Submitted</th><th>Latest</th><th>Details</th></tr></thead>
          <tbody>{filtered.map((f, index) => <tr key={f.id}><td>{fullName(f.clients)}<br />{f.clients?.email}</td><td>{f.service_label}</td><td>{formatDateTime(f.created_at)}</td><td>{index === 0 ? "Latest version" : ""}</td><td><button className="admin-link-button" onClick={() => setOpenId(openId === f.id ? null : f.id)}>View</button>{openId === f.id && <pre className="admin-json">{JSON.stringify(f.raw_payload || f.service_details || {}, null, 2)}</pre>}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
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
