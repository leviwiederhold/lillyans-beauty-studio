import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountMembershipPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/membership");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/membership");

  const supabase = createSupabaseAdminClient();
  const clientRes = await supabase?.from("clients").select("id").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = clientRes?.data;
  const membershipsRes = client ? await supabase?.from("memberships").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null;
  const memberships = membershipsRes?.data || [];
  const active = memberships.find((m) => m.status === "active");

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">My Account</p>
            <h1 className="sec-title">Membership</h1>
          </div>

          {active ? (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="card-header" style={{ background: "var(--black)" }}>
                <span className="card-title" style={{ color: "#fff", fontSize: "1rem" }}>{String(active.plan_name || "Active Membership")}</span>
                <span className="badge badge-green">Active</span>
              </div>
              <div className="card-body">
                <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Plan</span><span>{String(active.plan_name || "—")}</span></div>
                <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Status</span><span>{String(active.status || "—")}</span></div>
                <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Started</span><span>{formatDate(active.start_date)}</span></div>
                <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Next billing</span><span>{formatDate(active.renewal_date)}</span></div>
                <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Payment</span><span>{String(active.payment_status || "—")}</span></div>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                  <a href="mailto:lillyansbeautystudio@gmail.com?subject=Membership" className="btn btn-ghost btn-sm">Contact Studio</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="card-body">
                <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>No active membership. Explore plans to save on every visit.</p>
                <Link href="/memberships" className="btn btn-pink btn-sm">View Membership Plans</Link>
              </div>
            </div>
          )}

          {memberships.length > 1 && (
            <div className="card">
              <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Membership History</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Plan</th><th>Status</th><th>Start</th><th>Renewal</th></tr></thead>
                  <tbody>
                    {memberships.map((m) => (
                      <tr key={m.id}>
                        <td>{String(m.plan_name || "—")}</td>
                        <td><span className={`badge ${m.status === "active" ? "badge-green" : "badge-grey"}`}>{String(m.status || "")}</span></td>
                        <td>{formatDate(m.start_date)}</td>
                        <td>{formatDate(m.renewal_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
