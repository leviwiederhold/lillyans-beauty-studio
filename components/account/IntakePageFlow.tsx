"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntakeStep from "@/components/forms/IntakeStep";
import Form1_PMUIntake from "@/components/forms/Form1_PMUIntake";
import Form2_InformedConsent from "@/components/forms/Form2_InformedConsent";
import Form3_LiabilityWaiver from "@/components/forms/Form3_LiabilityWaiver";
import Form4_ConfidentialIntake from "@/components/forms/Form4_ConfidentialIntake";
import type { IntakeFormRecord } from "@/app/account/intake/page";

type Mode = "list" | "fill-category-pick" | "fill-sequence" | "update-single";

const FORM_TYPE_LABELS: Record<string, string> = {
  pmu_intake:          "PMU Intake",
  informed_consent:    "Informed Consent",
  liability_waiver:    "Liability Waiver",
  confidential_intake: "Confidential Intake",
};

const CATEGORIES = [
  {
    label: "Permanent Makeup services",
    category: "Permanent Makeup",
    description: "PMU intake · informed consent · liability waiver",
  },
  {
    label: "Facials, Waxing, Lifts & Tints, or Makeup",
    category: "Facials",
    description: "Confidential intake · liability waiver",
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function IntakePageFlow({
  userId,
  initialForms,
}: {
  userId: string;
  initialForms: IntakeFormRecord[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("list");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [updatingFormType, setUpdatingFormType] = useState<string | null>(null);
  const [localForms, setLocalForms] = useState<IntakeFormRecord[]>(initialForms);
  const [fillDone, setFillDone] = useState(false);

  // ── Single-form submit handler (used for Update) ─────────────────────────
  async function handleSingleFormNext(formData: Record<string, unknown>) {
    if (!updatingFormType) return;
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        bookingId: null,
        formType: updatingFormType,
        serviceCategory: null,
        serviceName: "Account Update",
        submittedAt: new Date().toISOString(),
        fields: formData.fields ?? formData,
        signature: (formData as Record<string, unknown>).signature ?? null,
        signature2: (formData as Record<string, unknown>).signature2 ?? null,
      }),
    });
    const now = new Date().toISOString();
    setLocalForms((prev) =>
      prev.map((f) =>
        f.form_type === updatingFormType ? { ...f, submitted_at: now } : f
      )
    );
    setUpdatingFormType(null);
    setMode("list");
  }

  // ── Render single form for Update mode ──────────────────────────────────
  function renderSingleForm() {
    if (!updatingFormType) return null;
    const sharedProps = {
      booking: { name: FORM_TYPE_LABELS[updatingFormType] ?? "Form", price: "", duration: "", category: "" },
      onNext: handleSingleFormNext,
      onBack: () => { setUpdatingFormType(null); setMode("list"); },
      formNumber: 1,
      formTotal: 1,
    };
    if (updatingFormType === "pmu_intake")          return <Form1_PMUIntake {...sharedProps} />;
    if (updatingFormType === "informed_consent")    return <Form2_InformedConsent {...sharedProps} />;
    if (updatingFormType === "liability_waiver")    return <Form3_LiabilityWaiver {...sharedProps} />;
    if (updatingFormType === "confidential_intake") return <Form4_ConfidentialIntake {...sharedProps} />;
    return null;
  }

  // ── Fill-sequence onComplete: refresh server data + show success ─────────
  function handleFillComplete() {
    setFillDone(true);
    router.refresh();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODE: update-single
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === "update-single") {
    return <div style={{ marginTop: "0.5rem" }}>{renderSingleForm()}</div>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODE: fill-category-pick
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === "fill-category-pick") {
    return (
      <div>
        <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)", marginBottom: "1.25rem" }}>
          Which forms apply to you? Select the type of services you receive.
        </p>
        <div className="g2" style={{ gap: "1rem", marginBottom: "1rem" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.category}
              onClick={() => { setSelectedCategory(cat.category); setMode("fill-sequence"); }}
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
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setMode("list")}
        >
          ← Cancel
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODE: fill-sequence
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === "fill-sequence" && selectedCategory) {
    if (fillDone) {
      return (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-header" style={{ background: "var(--black)" }}>
            <span className="card-title" style={{ color: "#fff" }}>Forms Submitted</span>
          </div>
          <div className="card-body">
            <div className="intake-status complete" style={{ marginBottom: "1rem" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your forms are now on file.
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
              Your intake information has been saved and will apply to your next appointment.
            </p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                className="btn btn-pink btn-sm"
                onClick={() => { setFillDone(false); setMode("list"); }}
              >
                View My Forms
              </button>
              <a href="/account" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
                My Account
              </a>
            </div>
          </div>
        </div>
      );
    }
    return (
      <IntakeStep
        booking={{ name: selectedCategory, price: "", duration: "", category: selectedCategory }}
        userId={userId}
        bookingId={null}
        onComplete={handleFillComplete}
        onBack={() => setMode("fill-category-pick")}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODE: list (default)
  // ─────────────────────────────────────────────────────────────────────────

  // Empty state
  if (localForms.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="intake-status pending" style={{ marginBottom: "1rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            No intake forms on file yet
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1.25rem" }}>
            Intake forms are required before your first appointment. You can fill them out now or
            complete them when you book.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-pink btn-sm"
              onClick={() => setMode("fill-category-pick")}
            >
              Fill out my forms now
            </button>
            <a href="/book" className="btn btn-outline btn-sm" style={{ textDecoration: "none" }}>
              Book an appointment
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Forms on file — per-form-type cards
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {localForms.map((f) => (
          <div key={f.form_type} className="card">
            <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--pink-dark)", flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--black)" }}>
                    {FORM_TYPE_LABELS[f.form_type] ?? f.form_type}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey-mid)" }}>
                  Last submitted {formatDate(f.submitted_at)}
                  {f.service_category ? ` · ${f.service_category}` : ""}
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => {
                  setUpdatingFormType(f.form_type);
                  setMode("update-single");
                }}
              >
                Update
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ fontSize: "0.95rem" }}>Need to add more forms?</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
            If you&apos;re booking a new service type, you may need to complete additional forms.
          </p>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button className="btn btn-pink btn-sm" onClick={() => setMode("fill-category-pick")}>
              Fill out more forms
            </button>
            <a href="/book" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
              Book an appointment
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
