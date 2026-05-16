"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const PLANS = [
  {
    id: "glow",
    name: "The Glow",
    price: 60,
    featured: false,
    perks: [
      "Choose 1 monthly: signature facial, brow tint & lami, or lash lift & tint",
      "10% off all services & retail",
      "Priority booking",
      "Member-only promotions",
      "Free birthday add-on",
      "No deposit required for membership services"
    ]
  },
  {
    id: "radiance",
    name: "The Radiance",
    price: 130,
    featured: true,
    perks: [
      "Choose 2 monthly: customized facial plus brow or lash lift & tint every 6–8 weeks",
      "15% off all services & retail",
      "Free tint quarterly",
      "Priority & after-hours booking",
      "No deposits, ever",
      "Upgraded birthday gift"
    ]
  },
  {
    id: "luminary",
    name: "The Luminary",
    price: 200,
    featured: false,
    perks: [
      "Monthly premium facial + add-on",
      "Brow and lash lift & tint every 6–8 weeks",
      "Up to $75/month in waxing",
      "20% off services & retail (incl. permanent makeup)",
      "VIP booking access",
      "No deposits, ever",
      "Premium birthday gift"
    ]
  }
];

export function MembershipPlans() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function selectPlan(planId: string) {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    setLoading(false);
    if (!data.user) {
      router.push("/login?next=/memberships");
      return;
    }
    setSelected(planId);
  }

  const selectedPlan = PLANS.find((p) => p.id === selected);

  return (
    <>
      <div className="g3" style={{ marginBottom: "1.5rem" }}>
        {PLANS.map((plan) => (
          <div key={plan.id} className={`mem-card${plan.featured ? " featured" : ""}`}>
            {plan.featured && <div className="mem-featured-tag">⭐ Best Value</div>}
            <div className="mem-body">
              <div className="mem-name">{plan.name}</div>
              <div className="mem-price">Starting at <strong>${plan.price}</strong>/month</div>
              <ul className="mem-perks">
                {plan.perks.map((perk) => (
                  <li key={perk}><span className="perk-dot">✦</span>{perk}</li>
                ))}
              </ul>
              <button
                className={`btn ${plan.featured ? "btn-pink" : "btn-app-outline"} btn-full`}
                style={{ marginBottom: "0.6rem" }}
                onClick={() => selectPlan(plan.id)}
                disabled={loading}
              >
                {selected === plan.id ? "✓ Selected" : `Select ${plan.name.replace("The ", "")} Plan`}
              </button>
              <p className="mem-note">Month-to-month · Cancel anytime</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="card">
          <div className="card-header" style={{ background: "var(--black)" }}>
            <span className="card-title" style={{ color: "#fff", fontSize: "1rem" }}>Membership Checkout</span>
            <span className="badge badge-pink">{selectedPlan.name} Selected</span>
          </div>
          <div className="card-body">
            <div className="g2" style={{ gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)", marginBottom: "1rem", lineHeight: 1.7 }}>
                  To start your membership, book your first appointment. Lilly will set up your recurring plan through Square after your first visit.
                </p>
                <a href="/book" className="btn btn-pink" style={{ display: "inline-flex" }}>Book First Appointment</a>
              </div>
              <div>
                <div style={{ background: "var(--border-light)", borderRadius: 6, padding: "1.2rem", marginBottom: "1rem" }}>
                  <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Plan</span><span>{selectedPlan.name}</span></div>
                  <div className="order-row"><span style={{ color: "var(--grey-mid)" }}>Billing cycle</span><span>Monthly</span></div>
                  <div className="order-row total" style={{ borderTop: "1.5px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.8rem" }}>
                    <span>Monthly rate</span><span style={{ color: "var(--pink-dark)" }}>${selectedPlan.price}.00/mo</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.68rem", color: "var(--grey-light)", lineHeight: 1.55 }}>
                  Membership is set up in person or by contacting the studio. No online card entry required.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
