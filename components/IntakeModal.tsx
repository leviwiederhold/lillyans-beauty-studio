"use client";

import { useEffect, useState } from "react";
import { BOOKING_URL } from "@/lib/constants";

export type IntakeType = "permanent_makeup" | "facial" | "waxing" | "wedding_inquiry";

const labels: Record<IntakeType, string> = {
  permanent_makeup: "Permanent Makeup",
  facial: "Facial",
  waxing: "Waxing",
  wedding_inquiry: "Wedding Inquiry"
};

export function IntakeModal({ type, onClose }: { type: IntakeType | null; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [prefill, setPrefill] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.style.overflow = type ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [type]);

  if (!type) return null;
  const currentType = type;

  async function lookup(form: HTMLFormElement) {
    const email = (form.elements.namedItem("email") as HTMLInputElement | null)?.value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement | null)?.value;
    if (!email && !phone) return;
    const res = await fetch("/api/intake");
    if (res.status === 401) {
      window.location.assign(`/login?next=${encodeURIComponent(BOOKING_URL)}`);
      return;
    }
    const data = await res.json();
    if (data.client) {
      setPrefill({
        first_name: data.client.first_name || "",
        last_name: data.client.last_name || "",
        date_of_birth: data.client.date_of_birth || "",
        address: data.client.address || "",
        emergency_contact_name: data.client.emergency_contact_name || "",
        emergency_contact_phone: data.client.emergency_contact_phone || "",
        medications: data.client.medications || "",
        allergies: data.client.allergies || "",
        skin_conditions: data.client.skin_conditions || "",
        previous_procedures: data.client.previous_procedures || ""
      });
      setMessage("We found your previous client record. Review and update anything that changed.");
    }
  }

  async function submit(formData: FormData) {
    setStatus("loading");
    setMessage("");
    const health = formData.getAll("health_conditions").map(String);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      type: currentType,
      health_conditions: health,
      consent_accuracy: formData.get("consent_accuracy") === "on",
      consent_updates: formData.get("consent_updates") === "on",
      consent_policy: formData.get("consent_policy") === "on",
      service_label: labels[currentType],
      service_details: {
        permanent_previous: formData.get("permanent_previous")?.toString(),
        cold_sores: formData.get("cold_sores")?.toString(),
        skin_concerns: formData.get("skin_concerns")?.toString(),
        skincare_products: formData.get("skincare_products")?.toString(),
        wax_areas: formData.get("wax_areas")?.toString(),
        retinoids: formData.get("retinoids")?.toString()
      }
    };

    const response = await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.status === 401) {
      window.location.assign(`/login?next=${encodeURIComponent(BOOKING_URL)}`);
      return;
    }
    if (!response.ok) {
      setStatus("error");
      setMessage(typeof data.error === "string" ? data.error : "Please check the required fields and consent boxes.");
      return;
    }
    setStatus("success");
    setMessage("Intake saved. Opening booking...");
    window.setTimeout(() => window.location.assign(BOOKING_URL), 500);
  }

  const title = `${labels[type]} - Medical Intake Form`;

  return (
    <div className="modal-overlay open" onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <p>Required before service · Strictly Confidential</p>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form action={submit}>
          <div className="modal-body">
            <div className="modal-notice">Your health and safety are our top priority. All information is strictly confidential and used only to ensure your service is performed safely and effectively.</div>
            <input className="hp" name="website" tabIndex={-1} autoComplete="off" />
            <p className="modal-section-title">Personal Information</p>
            <div className="form-row"><Field name="first_name" label="First Name *" value={prefill.first_name} /><Field name="last_name" label="Last Name *" value={prefill.last_name} /></div>
            <div className="form-row"><Field name="date_of_birth" label="Date of Birth *" type="date" value={prefill.date_of_birth} /><LookupField name="phone" label="Phone *" onBlur={lookup} /></div>
            <div className="form-row full"><LookupField name="email" label="Email *" type="email" onBlur={lookup} /></div>
            <div className="form-row full"><Field name="address" label="Home Address" value={prefill.address} /></div>
            <div className="form-row"><Field name="emergency_contact_name" label="Emergency Contact Name" value={prefill.emergency_contact_name} /><Field name="emergency_contact_phone" label="Emergency Contact Phone" value={prefill.emergency_contact_phone} /></div>
            <p className="modal-section-title">Medical History</p>
            <TextField name="medications" label="Current Medications (prescriptions, OTC, vitamins & supplements)" value={prefill.medications} />
            <TextField name="allergies" label="Known Allergies" value={prefill.allergies} />
            <TextField name="skin_conditions" label="Skin Conditions or Sensitivities" value={prefill.skin_conditions} />
            <TextField name="previous_procedures" label="Previous Cosmetic Procedures in Treatment Area" value={prefill.previous_procedures} />
            <p className="modal-section-title">Health Conditions - Check All That Apply</p>
            <div className="check-group">{["Pregnant or nursing", "Diabetes (Type 1 or 2)", "Heart condition or pacemaker", "Autoimmune disorder", "Active cold sores or herpes simplex", "History of keloid scarring", "Blood-thinning medications", "Accutane - currently or within the past 12 months", "Recent radiation or chemotherapy", "Skin cancer in or near the treatment area", "Active sunburn, open wounds, or breakouts in treatment area", "None of the above apply to me"].map((x) => <label className="check-item" key={x}><input name="health_conditions" value={x} type="checkbox" /><span>{x}</span></label>)}</div>
            {currentType === "permanent_makeup" && <><p className="modal-section-title">Permanent Makeup - Additional</p><TextField name="permanent_previous" label="Previous permanent makeup? Describe if yes." /><SelectField name="cold_sores" label="Prone to cold sores? (Required for lip clients)" /></>}
            {currentType === "facial" && <><p className="modal-section-title">Facial - Additional</p><TextField name="skin_concerns" label="Primary skin concern(s)" /><TextField name="skincare_products" label="Current skincare products used" /></>}
            {currentType === "waxing" && <><p className="modal-section-title">Waxing - Additional</p><Field name="wax_areas" label="Area(s) to be waxed *" /><SelectField name="retinoids" label="Using topical retinoids or AHAs in the wax area?" /></>}
            <p className="modal-section-title">Consent</p>
            <div className="check-group"><label className="check-item"><input name="consent_accuracy" type="checkbox" /><span>I confirm all information provided is accurate and complete.</span></label><label className="check-item"><input name="consent_updates" type="checkbox" /><span>I will inform Lillyan&apos;s Beauty Studio of any changes to my health before future appointments.</span></label><label className="check-item"><input name="consent_policy" type="checkbox" /><span>I agree to the studio&apos;s Booking Policy and consent to the service being performed.</span></label></div>
            <Field name="signature" label="Digital Signature - Type your full legal name *" />
            <div className="form-row"><Field name="signature_date" label="Date" type="date" value={new Date().toISOString().split("T")[0]} /><Field name="service_readonly" label="Service" value={labels[currentType]} readOnly /></div>
            {message && <p className={`form-status ${status}`}>{message}</p>}
          </div>
          <div className="modal-footer"><button type="button" className="btn-cancel" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={status === "loading"}>{status === "loading" ? "Submitting..." : "Submit & Proceed to Book"}</button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", value, readOnly }: { name: string; label: string; type?: string; value?: string; readOnly?: boolean }) {
  return <div className="mfg"><label>{label}</label><input name={name} type={type} defaultValue={value} readOnly={readOnly} /></div>;
}

function LookupField({ name, label, type = "text", onBlur }: { name: string; label: string; type?: string; onBlur: (form: HTMLFormElement) => void }) {
  return <div className="mfg"><label>{label}</label><input name={name} type={type} onBlur={(e) => onBlur(e.currentTarget.form!)} required /></div>;
}

function TextField({ name, label, value }: { name: string; label: string; value?: string }) {
  return <div className="mfg"><label>{label}</label><textarea name={name} defaultValue={value} /></div>;
}

function SelectField({ name, label }: { name: string; label: string }) {
  return <div className="mfg"><label>{label}</label><select name={name}><option value="">Select</option><option>Yes</option><option>No</option><option>Unsure</option></select></div>;
}
