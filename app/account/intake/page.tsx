import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountIntakePage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/intake");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/intake");

  const supabase = createSupabaseAdminClient();
  const clientRes = await supabase?.from("clients").select("id").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = clientRes?.data;
  const formsRes = client ? await supabase?.from("intake_forms").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null;
  const forms = formsRes?.data || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">My Account</p>
            <h1 className="sec-title">Medical Intake Forms</h1>
            <p className="sec-sub">Your intake forms are kept on file for each service type. Update them any time health conditions, medications, or allergies change.</p>
          </div>

          {forms.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div className="intake-status pending" style={{ marginBottom: "1rem" }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                  No intake forms on file yet
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
                  Intake forms are required for permanent makeup, facial, and waxing services. Complete yours when booking or via the link below.
                </p>
                <Link href="/book" className="btn btn-pink btn-sm">Book & Complete Form</Link>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Service Type</th><th>Submitted</th><th>Signature</th><th>Actions</th></tr></thead>
                  <tbody>
                    {forms.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {String(f.service_label || f.type || "General")}
                          </div>
                        </td>
                        <td>{formatDateTime(f.created_at)}</td>
                        <td>{String(f.signature || "—")}</td>
                        <td><Link href="/book" className="btn btn-ghost btn-sm">Update</Link></td>
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
