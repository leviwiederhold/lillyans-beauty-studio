"use client";

import { useState } from "react";
import type { MembershipPlan } from "@/lib/membership-plans";

export function MembershipCheckout({ plan, clientEmail }: { plan: MembershipPlan; clientEmail: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const firstBillingDate = new Date().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

  async function checkout() {
    setLoading(true);
    setMessage("Preparing membership checkout...");
    const res = await fetch("/api/memberships/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: plan.id })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Online membership checkout is being connected.");
      return;
    }
    if (data.checkout_url) {
      window.location.assign(data.checkout_url);
      return;
    }
    setMessage("Online membership checkout is being connected.");
  }

  return (
    <section className="membership-checkout" id="checkout">
      <div>
        <p className="section-label">Membership Checkout</p>
        <h2 className="section-title">{plan.name} Membership</h2>
        <p className="section-sub">Review your plan before continuing to Square checkout.</p>
        <ul className="membership-perks">
          {plan.perks.map((perk) => <li key={perk}><span className="perk-dot">✦</span>{perk}</li>)}
        </ul>
      </div>
      <aside className="membership-summary">
        <p className="membership-summary-label">Selected Plan</p>
        <h3>{plan.name}</h3>
        <dl>
          <div><dt>Monthly price</dt><dd>{plan.priceLabel}/month</dd></div>
          <div><dt>First billing date</dt><dd>{firstBillingDate}</dd></div>
          <div><dt>Account</dt><dd>{clientEmail}</dd></div>
        </dl>
        <p className="membership-note">Month-to-month. Cancel anytime by contacting the studio. Membership activates only after successful Square payment.</p>
        {message && <p className="form-status">{message}</p>}
        <button className="btn-primary full-btn" type="button" onClick={checkout} disabled={loading}>{loading ? "Preparing..." : "Continue to Square Checkout"}</button>
      </aside>
    </section>
  );
}
