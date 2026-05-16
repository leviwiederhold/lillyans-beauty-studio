import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MEMBERSHIP_PLANS, findMembershipPlan } from "@/lib/membership-plans";
import { MembershipCheckout } from "@/components/memberships/MembershipCheckout";

export const dynamic = "force-dynamic";

export default async function MembershipsPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const params = await searchParams;
  const selectedPlan = params.plan ? findMembershipPlan(params.plan) : null;
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };

  if (params.plan && !selectedPlan) redirect("/memberships");
  if (selectedPlan && !data.user) {
    redirect(`/login?next=${encodeURIComponent(`/memberships?plan=${selectedPlan.id}`)}`);
  }

  return (
    <main className="membership-page">
      <section className="membership-hero">
        <p className="section-label">Studio Memberships</p>
        <h1>Find Your <em>Perfect Fit</em></h1>
        <p>Join directly online and make self-care part of your monthly rhythm. Memberships activate after successful Square payment.</p>
      </section>

      <section className="membership-grid membership-page-grid">
        {MEMBERSHIP_PLANS.map((plan) => (
          <article className={`membership-card ${plan.tag ? "featured" : ""}`} key={plan.id}>
            {plan.tag && <div className="membership-featured-tag">{plan.tag}</div>}
            <div className="membership-body">
              <div className="membership-name">{plan.name}</div>
              <div className="membership-price"><strong>{plan.priceLabel}</strong><br />Every month</div>
              <ul className="membership-perks">
                {plan.perks.map((perk) => <li key={perk}><span className="perk-dot">✦</span>{perk}</li>)}
              </ul>
              <Link className={plan.tag ? "btn-primary full-btn" : "btn-outline full-btn"} href={`/memberships?plan=${plan.id}#checkout`}>Select</Link>
              <p className="membership-note">Month-to-month. Cancel anytime.</p>
            </div>
          </article>
        ))}
      </section>

      {selectedPlan && data.user?.email && <MembershipCheckout plan={selectedPlan} clientEmail={data.user.email} />}
    </main>
  );
}
