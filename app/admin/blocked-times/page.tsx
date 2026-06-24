import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BlockedTimesPage() {
  const { supabase } = await requireAdmin();
  const res = await supabase?.from("blocked_times").select("*").order("starts_at", { ascending: false }).limit(100);
  const rows = res?.data || [];

  return (
    <AdminShell title="Blocked Times" eyebrow="Schedule">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <a className="btn btn-primary" href="#block-new"><i className="ti ti-plus" style={{ fontSize: 13, marginRight: 5 }} />Block time</a>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-hdr"><span className="card-hdr-title">Upcoming Blocks</span></div>
          {rows.length === 0 ? (
            <div className="empty-state"><i className="ti ti-ban" /><div className="empty-title">No blocked times</div><div className="empty-sub">Blocked days and time ranges will appear here.</div></div>
          ) : (
            rows.map((r) => (
              <div className="block-card" key={r.id}>
                <div className="block-icon"><i className="ti ti-ban" /></div>
                <div className="block-info">
                  <div className="block-label">{String(r.reason || "Blocked time")}</div>
                  <div className="block-date">{formatDateTime(r.starts_at)} - {formatDateTime(r.ends_at)}</div>
                </div>
                <button className="icon-btn" style={{ marginLeft: "auto" }} aria-label="Delete blocked time"><i className="ti ti-trash" /></button>
              </div>
            ))
          )}
        </div>
        <div className="card" id="block-new">
          <div className="card-hdr"><span className="card-hdr-title">Vacation Mode</span></div>
          <div className="card-body">
            <div style={{ padding: 12, background: "var(--admin-bg)", borderRadius: 9, marginBottom: 14, fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>
              Block a full day, a partial day, or a travel window. Existing bookings are not affected automatically.
            </div>
            <form action="/api/admin/blocked-times" method="POST">
              <div className="f-row"><label className="f-label">Starts</label><input className="f-input" type="datetime-local" name="starts_at" required /></div>
              <div className="f-row"><label className="f-label">Ends</label><input className="f-input" type="datetime-local" name="ends_at" required /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Reason (optional)</label><input className="f-input" name="reason" placeholder="e.g. Holiday, vacation, training" /></div>
              <div style={{ paddingTop: 14 }}><button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Block time</button></div>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
