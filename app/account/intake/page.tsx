import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { IntakePageFlow } from "@/components/account/IntakePageFlow";

export const dynamic = "force-dynamic";

export type IntakeFormRecord = {
  form_type: string;
  service_category: string | null;
  submitted_at: string;
  fields: Record<string, unknown> | null;
};

export default async function AccountIntakePage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/intake");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/intake");

  const supabase = createSupabaseAdminClient();
  const formsRes = await supabase
    ?.from("client_forms")
    .select("form_type, service_category, submitted_at, fields")
    .eq("user_id", data.user.id)
    .order("submitted_at", { ascending: false });

  // Deduplicate by form_type — keep most recent per type
  const seen = new Set<string>();
  const forms: IntakeFormRecord[] = [];
  for (const row of formsRes?.data ?? []) {
    if (!seen.has(row.form_type)) {
      seen.add(row.form_type);
      forms.push(row as IntakeFormRecord);
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
            <p className="sec-sub">
              Your intake forms are kept on file for every service type. Fill them out once — update them
              any time your health information changes.
            </p>
          </div>
          <IntakePageFlow userId={data.user.id} initialForms={forms} />
        </div>
      </div>
    </div>
  );
}
