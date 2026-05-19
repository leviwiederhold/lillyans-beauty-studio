import { AppNav } from "@/components/AppNav";
import { MembershipPlans } from "@/components/MembershipPlans";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function MembershipsPage() {
  const supabase = createSupabaseAdminClient();
  const { data: plans } = await supabase
    ?.from("membership_plans")
    .select("id, name, price_cents, price_monthly, description, perks, is_active")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true }) ?? { data: [] };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p className="sec-label">For Regular Clients</p>
            <h1 className="sec-title" style={{ fontSize: "2.2rem" }}>Studio Memberships</h1>
            <p className="sec-sub" style={{ maxWidth: 420, margin: "0 auto 1.5rem" }}>
              Make self-care a routine. Save more, book easier, and get priority access every month.
            </p>
          </div>
          <MembershipPlans dbPlans={plans ?? []} />
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "0.8rem" }}>Questions about memberships?</p>
            <a href="mailto:lillyansbeautystudio@gmail.com" className="btn btn-ghost btn-sm">Contact the Studio</a>
          </div>
        </div>
      </div>
    </div>
  );
}
