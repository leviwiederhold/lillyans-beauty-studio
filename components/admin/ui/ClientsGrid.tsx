"use client";

import { useMemo, useState } from "react";
import { initialsOf } from "./components";

type Client = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  booking_count?: number;
  intake_count?: number;
  is_member?: boolean;
  member_label?: string;
};

function name(c: Client) {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Client";
}
function since(c: Client) {
  if (!c.created_at) return "New client";
  return `Client since ${new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export function ClientsGrid({ clients, initialQuery = "" }: { clients: Client[]; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return clients;
    return clients.filter((c) => [name(c), c.email, c.phone].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [clients, q]);

  return (
    <>
      <div className="filter-row">
        <div className="filter-search">
          <i className="ti ti-search" />
          <input placeholder="Search by name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><i className="ti ti-users" /><div className="empty-title">No clients <em>found</em></div><div className="empty-sub">Try a different search.</div></div></div>
      ) : (
        <div className="client-grid">
          {filtered.map((c) => (
            <div key={c.id} className="client-card">
              <div className="cc-top">
                <div className="cc-avatar">{initialsOf(name(c), c.email || undefined)}</div>
                <div>
                  <div className="cc-name">{name(c)}</div>
                  <div className="cc-since">{since(c)}</div>
                </div>
                {c.is_member && <span className="badge active" style={{ marginLeft: "auto" }}>{c.member_label || "Member"}</span>}
              </div>
              <div className="cc-stats">
                <div className="cc-stat"><span>{c.booking_count ?? 0}</span>Visits</div>
                <div className="cc-stat"><span>{c.intake_count ?? 0}</span>Forms</div>
                <div className="cc-stat"><span>{c.phone || "—"}</span>Phone</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
