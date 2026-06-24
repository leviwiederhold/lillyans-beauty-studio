"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Block = { id: string; starts_at: string; ends_at: string; reason?: string | null };
type Conflict = { id: string; client_name: string; service_type: string; starts_at: string };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function iconFor(reason?: string | null) {
  const r = (reason || "").toLowerCase();
  if (r.includes("vacation") || r.includes("travel")) return "ti-plane";
  if (r.includes("lunch") || r.includes("break")) return "ti-coffee";
  if (r.includes("holiday") || r.includes("closed")) return "ti-ban";
  return "ti-clock";
}

export function BlockedTimesManager({ blocks }: { blocks: Block[] }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  async function add(force = false) {
    if (!start || !end) { setMsg("Start and end are required."); return; }
    setMsg("Saving…"); setConflicts([]);
    const res = await fetch("/api/admin/blocked-times", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starts_at: start, ends_at: end, reason: reason || null, force }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.requiresConfirmation) {
      setConflicts(body.conflicts || []);
      setMsg("⚠️ Existing bookings fall in this range (below). Block anyway?");
      return;
    }
    if (res.ok) { setMsg("Time blocked."); setStart(""); setEnd(""); setReason(""); setConflicts([]); router.refresh(); }
    else setMsg(body.error || "Could not block time.");
  }

  async function remove(id: string) {
    const res = await fetch("/api/admin/blocked-times", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-hdr"><span className="card-hdr-title">Upcoming Blocks</span></div>
        {blocks.length === 0 ? (
          <div className="empty-state"><i className="ti ti-ban" /><div className="empty-title">No blocks <em>set</em></div><div className="empty-sub">Block vacations, holidays, or breaks to remove those slots.</div></div>
        ) : blocks.map((b) => (
          <div key={b.id} className="block-card">
            <div className="block-icon"><i className={`ti ${iconFor(b.reason)}`} /></div>
            <div className="block-info">
              <div className="block-label">{b.reason || "Blocked"}</div>
              <div className="block-date">{fmt(b.starts_at)} – {fmt(b.ends_at)}</div>
            </div>
            <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={() => remove(b.id)} title="Delete"><i className="ti ti-trash" /></button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hdr"><span className="card-hdr-title">Block New Time</span></div>
        <div className="card-body">
          <div className="f-grid2">
            <div className="f-row"><label className="f-label">Start</label><input className="f-input" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="f-row"><label className="f-label">End</label><input className="f-input" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="f-row"><label className="f-label">Reason / label</label><input className="f-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vacation, Holiday, Lunch" /></div>
          <button className="btn btn-primary" onClick={() => add(false)}>Block this time</button>
          {msg && <p style={{ fontSize: 12, color: conflicts.length ? "#c27c2c" : "var(--ink3)", marginTop: 10 }}>{msg}</p>}
          {conflicts.length > 0 && (
            <div style={{ marginTop: 10, padding: 10, background: "#fdf6ec", border: "1px solid #f0d8a8", borderRadius: 8 }}>
              <ul style={{ fontSize: 12, color: "#92400e", paddingLeft: 16, marginBottom: 8 }}>
                {conflicts.map((c) => <li key={c.id}>{c.client_name} — {c.service_type} ({new Date(c.starts_at).toLocaleString()})</li>)}
              </ul>
              <button className="btn btn-danger" onClick={() => add(true)}>Block anyway</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
