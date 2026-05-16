import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/settings");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/settings");

  const supabase = createSupabaseAdminClient();
  const clientRes = await supabase?.from("clients").select("*").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = clientRes?.data;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 680 }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">My Account</p>
            <h1 className="sec-title">Account Settings</h1>
            <p className="sec-sub">Update your contact information and health details on file.</p>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Profile & Intake Information</span></div>
            <div className="card-body">
              <ClientProfileForm client={client || { email: data.user.email }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
