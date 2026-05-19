import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { formatDate, formatDateTime, fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return email?.[0]?.toUpperCase() ?? "?";
}

export default async function AccountPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login");
  const { data } = await auth.auth.getUser();
  if (!data.user?.email) redirect("/login");

  const supabase = createSupabaseAdminClient();
  const clientRes = await supabase?.from("clients").select("*").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = clientRes?.data;

  const [formsRes, bookingsRes, membershipsRes, codesRes] = await Promise.all([
    supabase?.from("client_forms").select("form_type, submitted_at").eq("user_id", data.user.id).order("submitted_at", { ascending: false }),
    client ? supabase?.from("bookings").select("*, services(name,duration_minutes)").eq("client_id", client.id).order("starts_at", { ascending: false }) : null,
    client ? supabase?.from("memberships").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null,
    client ? supabase?.from("gift_card_code_redemptions").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null
  ]);

  const allBookings = bookingsRes?.data || [];
  const now = new Date();
  const upcoming = allBookings.filter((b) => b.starts_at && new Date(b.starts_at) >= now);
  const past = allBookings.filter((b) => b.starts_at && new Date(b.starts_at) < now);
  const activeMembership = (membershipsRes?.data || []).find((m) => m.status === "active");
  const forms = formsRes?.data || [];
  const codes = codesRes?.data || [];

  const displayName = fullName(client) || data.user.email || "";
  const userInitials = initials(displayName, data.user.email);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 760 }}>

          {/* Profile header */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-body">
              <div className="profile-row">
                <div className="profile-avatar">{userInitials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400 }}>{displayName || "Your Profile"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--grey-mid)" }}>
                    {data.user.email}{client?.phone ? ` · ${client.phone}` : ""}
                  </div>
                  {activeMembership && (
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem" }}>
                      <span className="badge badge-pink">{String(activeMembership.plan_name || "Member")}</span>
                      <span className="badge badge-green">Active</span>
                    </div>
                  )}
                </div>
                <Link href="/account/settings" className="btn btn-ghost btn-sm">Edit Profile</Link>
              </div>
            </div>
          </div>

          <div className="g2" style={{ gap: "1rem", marginBottom: "1rem" }}>
            {/* Upcoming bookings */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: "1rem" }}>Upcoming Appointments</span>
                <Link href="/book" className="btn btn-pink btn-sm">+ Book New</Link>
              </div>
              <div className="card-body">
                {upcoming.length === 0 && <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>No upcoming appointments.</p>}
                {upcoming.slice(0, 3).map((b) => {
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
                        <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span className={`badge ${b.status === "confirmed" ? "badge-green" : b.status === "cancelled" ? "badge-grey" : "badge-amber"}`}>{b.status}</span>
                          {b.deposit_status === "paid" && <span className="badge badge-amber">Deposit Paid</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {upcoming.length > 3 && <Link href="/account/bookings" style={{ fontSize: "0.75rem", color: "var(--pink-dark)" }}>View all {upcoming.length} bookings →</Link>}
              </div>
            </div>

            {/* Membership */}
            <div className="card">
              <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Membership</span></div>
              <div className="card-body">
                {activeMembership ? (
                  <>
                    <div style={{ background: "var(--pink-light)", border: "1px solid var(--border)", borderRadius: 6, padding: "1rem", marginBottom: "1rem" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", marginBottom: "0.2rem" }}>{String(activeMembership.plan_name || "Membership")}</div>
                      {activeMembership.renewal_date && <div style={{ fontSize: "0.72rem", color: "var(--grey-mid)", marginTop: "0.3rem" }}>Next billing: {formatDate(activeMembership.renewal_date)}</div>}
                    </div>
                    <Link href="/account/membership" className="btn btn-ghost btn-sm">View Details</Link>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>No active membership. Explore plans to save on every visit.</p>
                    <Link href="/memberships" className="btn btn-app-outline btn-sm">View Membership Plans</Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="g2" style={{ gap: "1rem", marginBottom: "1rem" }}>
            {/* Intake forms */}
            <div className="card">
              <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Medical Intake Forms</span></div>
              <div className="card-body">
                {forms.length === 0 ? (
                  <div className="intake-status pending">
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                    No intake forms on file
                  </div>
                ) : (
                  forms.slice(0, 3).map((f) => {
                    const FORM_LABELS: Record<string, string> = {
                      pmu_intake: "PMU Intake",
                      informed_consent: "Informed Consent",
                      liability_waiver: "Liability Waiver",
                      confidential_intake: "Confidential Intake",
                    };
                    return (
                      <div key={f.form_type} className="intake-status complete" style={{ marginBottom: "0.5rem" }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {FORM_LABELS[f.form_type] ?? f.form_type} — on file
                      </div>
                    );
                  })
                )}
                <Link href="/account/intake" className="btn btn-app-outline btn-sm" style={{ marginTop: "0.6rem" }}>Manage Intake Forms</Link>
              </div>
            </div>

            {/* Gift cards */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: "1rem" }}>Gift Cards & Codes</span>
                <Link href="/gift-cards" className="btn btn-pink btn-sm">Buy Gift Card</Link>
              </div>
              <div className="card-body">
                {codes.length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>No gift cards or codes on file.</p>
                ) : (
                  codes.slice(0, 3).map((c) => (
                    <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "0.9rem", marginBottom: "0.7rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span className="gc-code">{String(c.code || "")}</span>
                        <span className={`badge ${c.status === "active" ? "badge-green" : "badge-grey"}`}>{String(c.status || "")}</span>
                      </div>
                      {c.created_at && <div style={{ fontSize: "0.72rem", color: "var(--grey-light)" }}>Used {formatDate(c.created_at)}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Booking history */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: "1rem" }}>Booking History</span>
              <Link href="/account/bookings" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {past.length === 0 ? (
                <p style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--grey-mid)" }}>No past bookings yet.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Service</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {past.slice(0, 5).map((b) => (
                      <tr key={b.id}>
                        <td>{formatDate(b.starts_at)}</td>
                        <td>{b.service_type}</td>
                        <td><span className={`badge ${b.status === "completed" ? "badge-green" : "badge-grey"}`}>{b.status}</span></td>
                        <td><Link href="/book" className="btn btn-ghost btn-sm">Rebook</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Settings link */}
          <div className="card">
            <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Account Settings</span></div>
            <div className="card-body">
              <div className="g2" style={{ gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "0.8rem" }}>Update your contact info, birthday, and notification preferences.</p>
                  <Link href="/account/settings" className="btn btn-pink btn-sm">Edit Settings</Link>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>
                  <div><strong style={{ fontWeight: 500 }}>Email:</strong> {data.user.email}</div>
                  {client?.phone && <div style={{ marginTop: "0.4rem" }}><strong style={{ fontWeight: 500 }}>Phone:</strong> {client.phone}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
