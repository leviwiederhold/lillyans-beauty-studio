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
  const [servicesRes, clientFormsRes, profileRes] = await Promise.all([
    supabase?.from("services").select("*, service_categories(name)").eq("is_active", true).order("sort_order"),
    supabase?.from("client_forms").select("form_type, submitted_at").eq("user_id", userData.user.id).order("submitted_at", { ascending: false }),
    supabase?.from("profiles").select("full_name,phone").eq("id", userData.user.id).maybeSingle(),
  ]);

  // Deduplicate by form_type — keep most recent submitted_at per type
  const seen = new Set<string>();
  const existingFormTypes: { form_type: string; submitted_at: string }[] = [];
  for (const row of clientFormsRes?.data ?? []) {
    if (!seen.has(row.form_type)) {
      seen.add(row.form_type);
      existingFormTypes.push(row);
    }
  }

  const profileName: string = profileRes?.data?.full_name ?? "";
  const nameParts = profileName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";
  const phone: string = profileRes?.data?.phone ?? "";

  return (
    <div className="bk-book-page" style={{ minHeight: "100vh" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner wide">
          <div className="bk-page-intro" style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">Step-by-step</p>
            <h1 className="sec-title">Book Your Appointment</h1>
            <p className="sec-sub">Licensed esthetician &amp; certified permanent makeup artist — Fayetteville, OH</p>
          </div>
          <BookingFlow
            services={servicesRes?.data || []}
            existingFormTypes={existingFormTypes}
            userEmail={userData.user.email ?? ""}
            userFirstName={firstName}
            userLastName={lastName}
            userPhone={phone}
            userId={userData.user.id}
          />
        </div>
      </div>
    </div>
  );
}
