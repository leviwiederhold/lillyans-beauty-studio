import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FORM_TYPE_LABELS: Record<string, string> = {
  pmu_intake:          "PMU Intake",
  informed_consent:    "Informed Consent",
  liability_waiver:    "Liability Waiver",
  confidential_intake: "Confidential Intake",
};

export default async function AccountIntakePage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/intake");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/intake");

  const supabase = createSupabaseAdminClient();
  const formsRes = await supabase
    ?.from("client_forms")
    .select("form_type, service_category, service_name, submitted_at")
    .eq("user_id", data.user.id)
    .order("submitted_at", { ascending: false });

  // Deduplicate by form_type — keep most recent per type
  const seen = new Set<string>();
  const forms: { form_type: string; service_category: string | null; service_name: string | null; submitted_at: string }[] = [];
  for (const row of formsRes?.data ?? []) {
    if (!seen.has(row.form_type)) {
      seen.add(row.form_type);
      forms.push(row);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">My Account</p>
            <h1 className="sec-title">Intake Forms</h1>
            <p className="sec-sub">Your intake forms are kept on file. Update them any time your health info, medications, or allergies change.</p>
          </div>

          {forms.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div className="intake-status pending" style={{ marginBottom: "1rem" }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  No intake forms on file yet
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
                  Intake forms are collected the first time you book a service. Complete yours when you book your next appointment.
                </p>
                <Link href="/book" className="btn btn-pink btn-sm">Book an Appointment</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: "1rem" }}>Forms on File</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Form</th>
                        <th>Service Category</th>
                        <th>Last Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((f) => (
                        <tr key={f.form_type}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {FORM_TYPE_LABELS[f.form_type] ?? f.form_type}
                            </div>
                          </td>
                          <td>{f.service_category ?? "—"}</td>
                          <td>{formatDateTime(f.submitted_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: "1rem" }}>Update My Forms</span>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
                    If your health information, medications, or allergies have changed, please update your forms before your next appointment.
                  </p>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Link href="/account/forms?category=Facials" className="btn btn-outline btn-sm">
                      Update Facial / Waxing / Lifts Forms
                    </Link>
                    <Link href="/account/forms?category=Permanent+Makeup" className="btn btn-outline btn-sm">
                      Update PMU Forms
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
