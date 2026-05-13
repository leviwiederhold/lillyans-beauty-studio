"use client";

import { useState } from "react";

export function AdminSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Record<string, any>[]>([]);
  async function search(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setResults(data.results || []);
  }
  return (
    <div className="admin-search">
      <input value={q} onChange={(e) => search(e.target.value)} placeholder="Search everything..." />
      {results.length > 0 && <div className="admin-search-results">{results.map((r) => <p key={`${r.result_type}-${r.id}`}><strong>{r.result_type}</strong> {r.first_name || r.client_name || r.name || r.service_type || r.subject || r.service_label} {r.email || ""}</p>)}</div>}
    </div>
  );
}
