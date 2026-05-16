import { useState } from "react";
import Form1_PMUIntake from "./Form1_PMUIntake";
import Form2_InformedConsent from "./Form2_InformedConsent";
import Form3_LiabilityWaiver from "./Form3_LiabilityWaiver";
import Form4_ConfidentialIntake from "./Form4_ConfidentialIntake";

// Which forms to show per category (in order)
const FORM_SEQUENCES = {
  "Permanent Makeup": ["pmu_intake", "informed_consent", "liability_waiver"],
  "Facials":          ["confidential_intake", "liability_waiver"],
  "Waxing":           ["confidential_intake", "liability_waiver"],
  "Lifts & Tints":    ["confidential_intake", "liability_waiver"],
  "Formal Makeup":    ["confidential_intake", "liability_waiver"],
};

async function submitForm(userId, bookingId, booking, formData) {
  const payload = {
    userId,
    bookingId,
    formType:        formData.formType,
    serviceCategory: booking.category,
    serviceName:     booking.name,
    submittedAt:     formData.submittedAt,
    fields:          formData.fields,
    signature:       formData.signature || formData.signature1 || null,
    signature2:      formData.signature2 || null,
  };
  const res = await fetch("/api/forms", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save form");
  return res.json();
}

export default function IntakeStep({ booking, userId, bookingId, onComplete, onBack }) {
  const sequence = FORM_SEQUENCES[booking.category] || ["confidential_intake", "liability_waiver"];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleFormNext(formData) {
    setSaving(true);
    setError(null);
    try {
      await submitForm(userId, bookingId, booking, formData);
      if (step < sequence.length - 1) {
        setStep(step + 1);
      } else {
        onComplete(); // All forms done — advance to Step 4
      }
    } catch (e) {
      setError("Something went wrong saving your form. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (step === 0) {
      onBack();
    } else {
      setStep(step - 1);
    }
  }

  if (saving) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", fontFamily:"'DM Sans',sans-serif", color:"#2c2220" }}>
        <div style={{ width:32, height:32, border:"3px solid #f0e8e4", borderTop:"3px solid #b85c72", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <div style={{ marginTop:16, fontSize:14, color:"#a08080" }}>Saving your form...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding:24, fontFamily:"'DM Sans',sans-serif", color:"#2c2220" }}>
        <div style={{ background:"#fff5f5", border:"1px solid #f0d8d8", borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:14, color:"#8a2020" }}>{error}</div>
        </div>
        <button style={{ padding:"12px 20px", background:"#b85c72", color:"#fff", border:"none", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:"pointer" }} onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  const currentForm = sequence[step];
  const formNumber = step + 1;
  const formTotal = sequence.length;

  const commonProps = { booking, onNext: handleFormNext, onBack: handleBack, formNumber, formTotal };

  switch (currentForm) {
    case "pmu_intake":         return <Form1_PMUIntake {...commonProps} />;
    case "informed_consent":   return <Form2_InformedConsent {...commonProps} />;
    case "liability_waiver":   return <Form3_LiabilityWaiver {...commonProps} />;
    case "confidential_intake": return <Form4_ConfidentialIntake {...commonProps} />;
    default: return null;
  }
}
