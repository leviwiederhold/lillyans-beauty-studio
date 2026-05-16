import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountBookingsPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/bookings");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/bookings");

  const supabase = createSupabaseAdminClient();
  const clientRes = await supabase?.from("clients").select("id").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = clientRes?.data;
  const bookingsRes = client ? await supabase?.from("bookings").select("*").eq("client_id", client.id).order("starts_at", { ascending: false }) : null;
  const bookings = bookingsRes?.data || [];
  const now = new Date();
  const upcoming = bookings.filter((b) => b.starts_at && new Date(b.starts_at) >= now);
  const past = bookings.filter((b) => b.starts_at && new Date(b.starts_at) < now);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <p className="sec-label">My Account</p>
              <h1 className="sec-title">My Bookings</h1>
            </div>
            <Link href="/book" className="btn btn-pink btn-sm">+ Book New</Link>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Upcoming ({upcoming.length})</span></div>
            <div className="card-body">
              {upcoming.length === 0 && <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>No upcoming appointments.</p>}
              {upcoming.map((b) => {
                const d = b.starts_at ? new Date(b.starts_at) : null;
                return (
                  <div key={b.id} className="booking-item">
                    {d && (
                      <div className="booking-date-box">
                        <div className="booking-date-mon">{d.toLocaleString("en-US", { month: "short" })}</div>
                        <div className="booking-date-day">{d.getDate()}</div>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: "0.88rem" }}>{b.service_type}</div>
                      {d && <div style={{ fontSize: "0.75rem", color: "var(--grey-mid)" }}>{d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>}
                      <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.4rem" }}>
                        <span className={`badge ${b.status === "confirmed" ? "badge-green" : b.status === "cancelled" ? "badge-grey" : "badge-amber"}`}>{b.status}</span>
                        {b.deposit_status === "paid" && <span className="badge badge-amber">Deposit Paid</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>History ({past.length})</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {past.length === 0 ? (
                <p style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--grey-mid)" }}>No past bookings yet.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Service</th><th>Status</th><th>Deposit</th></tr></thead>
                  <tbody>
                    {past.map((b) => (
                      <tr key={b.id}>
                        <td>{formatDateTime(b.starts_at)}</td>
                        <td>{b.service_type}</td>
                        <td><span className={`badge ${b.status === "completed" ? "badge-green" : "badge-grey"}`}>{b.status}</span></td>
                        <td>{b.deposit_status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
