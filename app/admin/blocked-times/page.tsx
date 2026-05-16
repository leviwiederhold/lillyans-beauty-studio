import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BlockedTimesPage() {
  const { supabase } = await requireAdmin();
  const res = await supabase?.from("blocked_times").select("*").order("starts_at", { ascending: false }).limit(100);
  const rows = res?.data || [];

  return (
    <AdminShell title="Blocked Times" eyebrow="Admin / Studio">
      <div className="card">
        <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Blocked Periods ({rows.length})</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          {rows.length === 0 ? (
            <p style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--grey-mid)" }}>No blocked times configured.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Start</th><th>End</th><th>Reason</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateTime(r.starts_at)}</td>
                    <td>{formatDateTime(r.ends_at)}</td>
                    <td style={{ color: "var(--grey-mid)" }}>{String(r.reason || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: "1rem", maxWidth: 480 }}>
        <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Block New Time</span></div>
        <div className="card-body">
          <form action="/api/admin/blocked-times" method="POST">
            <div className="g2" style={{ gap: "0.8rem" }}>
              <div className="field-group">
                <label className="field-label">Start</label>
                <input className="field-input" type="datetime-local" name="starts_at" required />
              </div>
              <div className="field-group">
                <label className="field-label">End</label>
                <input className="field-input" type="datetime-local" name="ends_at" required />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Reason (optional)</label>
              <input className="field-input" name="reason" placeholder="e.g. Vacation, Holiday" />
            </div>
            <button type="submit" className="btn btn-pink btn-sm">Block This Time</button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
