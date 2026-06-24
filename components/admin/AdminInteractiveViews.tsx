"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName } from "@/lib/format";

type Row = Record<string, any>;

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
