"use client";

import { useState } from "react";

export function MedicalFormEditor({ client }: { client: Record<string, any> }) {
  const [message, setMessage] = useState("");

  async function submit(fd: FormData) {
    setMessage("Saving medical form...");
    const res = await fetch("/api/account/medical-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries()))
    });
    const body = await res.json();
    setMessage(res.ok ? "Medical form saved and marked current." : body.error || "Could not save medical form.");
  }

  return (
    <section className="admin-card" id="medical-forms">
      <h2>Medical / Intake Form</h2>
      <p className="admin-empty">Save your current medical information as the default for future bookings.</p>
      <form action={submit}>
        <div className="form-row">
          <label>Date of birth<input name="date_of_birth" type="date" defaultValue={client.date_of_birth || ""} /></label>
          <label>Phone<input name="phone" defaultValue={client.phone || ""} /></label>
        </div>
        <label>Address<input name="address" defaultValue={client.address || ""} /></label>
        <div className="form-row">
          <label>Emergency contact name<input name="emergency_contact_name" defaultValue={client.emergency_contact_name || ""} /></label>
          <label>Emergency contact phone<input name="emergency_contact_phone" defaultValue={client.emergency_contact_phone || ""} /></label>
        </div>
        <label>Current medications<textarea name="medications" defaultValue={client.medications || ""}></textarea></label>
        <label>Known allergies<textarea name="allergies" defaultValue={client.allergies || ""}></textarea></label>
        <label>Skin conditions / sensitivities<textarea name="skin_conditions" defaultValue={client.skin_conditions || ""}></textarea></label>
        <label>Previous cosmetic procedures<textarea name="previous_procedures" defaultValue={client.previous_procedures || ""}></textarea></label>
        <label className="check-item"><input type="checkbox" name="confirmed_current" value="true" required /><span>I confirm this information is accurate and up to date.</span></label>
        {message && <p className="admin-message">{message}</p>}
        <button className="btn-primary">Save Medical Form</button>
      </form>
    </section>
  );
}
