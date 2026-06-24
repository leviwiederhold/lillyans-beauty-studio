"use client";

import { useMemo, useState } from "react";
import { DataTable, StatusBadge } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName } from "@/lib/format";

type Row = Record<string, any>;

export function SearchableClients({ clients }: { clients: Row[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter((c) => [fullName(c), c.email, c.phone, c.membership_status, c.services_used].join(" ").toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <>
      <div className="filter-row">
        <div className="filter-search"><i className="ti ti-search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, phone..." /></div>
        <div className="filter-pill active">All</div>
        <div className="filter-pill">Active</div>
        <div className="filter-pill">Members</div>
      </div>
      <div className="client-grid">
        {filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><i className="ti ti-users" /><div className="empty-title">No clients found</div><div className="empty-sub">Try a different search.</div></div></div>
        ) : filtered.slice(0, 12).map((client) => (
          <div className="client-card" key={client.id}>
            <div className="cc-top">
              <div className="cc-avatar">{initials(fullName(client), client.email)}</div>
              <div><div className="cc-name">{fullName(client) || client.email || "Client"}</div><div className="cc-since">{client.created_at ? `Client since ${new Date(client.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "Client"}</div></div>
              {client.membership_status && <span className="badge active" style={{ marginLeft: "auto" }}>Member</span>}
            </div>
            <div className="cc-stats">
              <div className="cc-stat"><span>{client.booking_count || 0}</span>Bookings</div>
              <div className="cc-stat"><span>{client.intake_count || 0}</span>Forms</div>
              <div className="cc-stat"><span>{(client.services_used || []).length}</span>Services</div>
            </div>
          </div>
        ))}
      </div>
    </>
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
    <section className="card">
      <div className="card-hdr"><span className="card-hdr-title">Intake Forms</span></div>
      <div className="card-body">
        <div className="filter-row">
          <div className="filter-search"><i className="ti ti-search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client..." /></div>
          <button className={`filter-pill${!type ? " active" : ""}`} onClick={() => setType("")}>All</button>
          {types.map((t) => <button className={`filter-pill${type === t ? " active" : ""}`} key={t} onClick={() => setType(String(t))}>{String(t).replaceAll("_", " ")}</button>)}
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="data-table">
          <thead><tr><th>Client</th><th>Service</th><th>Submitted</th><th>Latest</th><th>Status</th><th>Details</th></tr></thead>
          <tbody>{filtered.map((f, index) => <tr key={f.id}><td><div className="dt-name">{fullName(f.clients) || f.clients?.email || "Client"}</div><div className="dt-sub">{f.clients?.email}</div></td><td>{f.service_label || f.type}</td><td>{formatDateTime(f.created_at)}</td><td>{index === 0 ? "Latest version" : ""}</td><td><StatusBadge status={f.reviewed ? "reviewed" : "needs review"} /></td><td><button className="admin-link-button" onClick={() => setOpenId(openId === f.id ? null : f.id)}>View</button>{openId === f.id && <pre className="admin-json">{JSON.stringify(f.raw_payload || f.service_details || {}, null, 2)}</pre>}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function initials(name: string, email?: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return email?.[0]?.toUpperCase() || "C";
}
