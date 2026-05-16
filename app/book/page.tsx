import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { AppNav } from "@/components/AppNav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/book");
  const { data: userData } = await auth.auth.getUser();
  if (!userData.user) redirect("/login?next=/book");

  const supabase = createSupabaseAdminClient();
  const [servicesRes, clientRes] = await Promise.all([
    supabase?.from("services").select("*, service_categories(name)").eq("is_active", true).order("sort_order"),
    supabase?.from("clients").select("id").or(`profile_id.eq.${userData.user.id},email.ilike.${userData.user.email}`).limit(1).maybeSingle()
  ]);

  const client = clientRes?.data;
  const [intakeFormsRes, profileRes] = await Promise.all([
    client
      ? supabase?.from("intake_forms").select("id,type,service_label,created_at").eq("client_id", client.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase?.from("profiles").select("full_name,phone").eq("id", userData.user.id).maybeSingle()
  ]);
  const intakeForms = intakeFormsRes?.data ?? [];
  const profileName: string = profileRes?.data?.full_name ?? "";
  const nameParts = profileName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";
  const phone: string = profileRes?.data?.phone ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner wide">
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">Step-by-step</p>
            <h1 className="sec-title">Book Your Appointment</h1>
            <p className="sec-sub">Licensed esthetician &amp; certified permanent makeup artist — Fayetteville, OH</p>
          </div>
          <BookingFlow
            services={servicesRes?.data || []}
            intakeForms={intakeForms}
            userEmail={userData.user.email ?? ""}
            userFirstName={firstName}
            userLastName={lastName}
            userPhone={phone}
          />
        </div>
      </div>
    </div>
  );
}
