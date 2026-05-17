"use client";

import { useState } from "react";
import IntakeStep from "@/components/forms/IntakeStep";

const CATEGORIES = [
  {
    label: "Facial / Waxing / Lifts / Makeup",
    category: "Facials",
    description: "Confidential intake + liability waiver",
  },
  {
    label: "Permanent Makeup (PMU)",
    category: "Permanent Makeup",
    description: "PMU intake + informed consent + liability waiver",
  },
];

export function FormsUpdateFlow({ userId, initialCategory }: { userId: string; initialCategory?: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header" style={{ background: "var(--black)" }}>
          <span className="card-title" style={{ color: "#fff" }}>Forms Updated</span>
        </div>
        <div className="card-body">
          <div className="intake-status complete" style={{ marginBottom: "1rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your forms have been updated successfully.
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
            Your new intake information is now on file and will apply to your next appointment.
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <a href="/account/intake" className="btn btn-pink btn-sm" style={{ textDecoration: "none" }}>View My Forms</a>
            <a href="/account" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>My Account</a>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    const catConfig = CATEGORIES.find(c => c.category === selectedCategory);
    return (
      <IntakeStep
        booking={{ name: catConfig?.label ?? selectedCategory, price: "", duration: "", category: selectedCategory }}
        userId={userId}
        bookingId={null}
        onComplete={() => setDone(true)}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)", marginBottom: "1.25rem" }}>
        Select which set of forms you&apos;d like to update. All fields will be pre-populated with your existing information where possible.
      </p>
      <div className="g2" style={{ gap: "1rem" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            style={{
              background: "#fff",
              border: "1.5px solid var(--border)",
              borderRadius: 12,
              padding: "1.25rem",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--pink-dark)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: 4, color: "var(--black)" }}>
              {cat.label}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--grey-mid)" }}>{cat.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
