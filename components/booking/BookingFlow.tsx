"use client";

import { useState } from "react";

export function BookingFlow({ services, categories }: { services: Record<string, any>[]; categories: Record<string, any>[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const service = services.find((s) => s.id === serviceId);

  async function loadSlots(nextDate: string, nextService = serviceId) {
    setDate(nextDate);
    setSelectedSlot("");
    setSlots([]);
    if (!nextDate || !nextService) return;
    setMessage("Checking availability...");
    const res = await fetch(`/api/availability?service_id=${nextService}&date=${nextDate}`);
    const data = await res.json();
    setSlots(data.slots || []);
    setMessage(data.slots?.length ? "" : "No available times for that date.");
  }

  async function submit(fd: FormData) {
    setMessage("Submitting booking request...");
    const payload = { ...Object.fromEntries(fd.entries()), service_id: serviceId, starts_at: selectedSlot };
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Could not create booking.");
      return;
    }
    if (data.square_checkout_url) {
      window.location.assign(data.square_checkout_url);
      return;
    }
    setMessage(data.requires_intake ? "Booking request received. Please complete the required intake form before your appointment." : "Booking request received. Lilly will confirm it soon.");
  }

  if (services.length === 0) {
    return <section className="booking-panel"><p>No services are available for online booking yet. Please contact the studio.</p></section>;
  }

  return (
    <section className="booking-grid">
      <div className="booking-panel">
        <h2>Service</h2>
        {categories.length > 0 && <p className="booking-muted">Categories are managed by Lilly in admin.</p>}
        <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); if (date) loadSlots(date, e.target.value); }}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
        </select>
        {service && <div className="booking-service-detail"><p>{service.description}</p><p>{service.requires_intake ? "Intake form required." : "No intake form required."}</p><p>{service.service_total ? `Service total: $${(service.service_total / 100).toFixed(2)}` : ""}</p><p>{service.requires_deposit ? "20% deposit required through Square. Remaining balance is due in person." : "No deposit required."}</p></div>}
      </div>
      <div className="booking-panel">
        <h2>Date & Time</h2>
        <input type="date" value={date} onChange={(e) => loadSlots(e.target.value)} />
        <div className="slot-grid">
          {slots.map((slot) => <button type="button" className={selectedSlot === slot ? "slot active" : "slot"} onClick={() => setSelectedSlot(slot)} key={slot}>{new Date(slot).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</button>)}
        </div>
      </div>
      <form className="booking-panel" action={submit}>
        <h2>Your Details</h2>
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" />
        <label>First name<input name="first_name" required /></label>
        <label>Last name<input name="last_name" /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Phone<input name="phone" /></label>
        <label>Gift card / no-deposit code<input name="gift_card_code" /></label>
        <label>Notes<textarea name="notes"></textarea></label>
        {service?.requires_intake && (
          <div className="booking-intake">
            <h2>Required Intake</h2>
            <label>Current medications<textarea name="medications" required></textarea></label>
            <label>Known allergies<textarea name="allergies" required></textarea></label>
            <label>Skin conditions / sensitivities<textarea name="skin_conditions"></textarea></label>
            <label>Previous procedures<textarea name="previous_procedures"></textarea></label>
            <label className="check-item"><input name="consent_accuracy" type="checkbox" required /><span>I confirm all information provided is accurate and complete.</span></label>
            <label className="check-item"><input name="consent_updates" type="checkbox" required /><span>I will inform Lillyan&apos;s Beauty Studio of any health changes before future appointments.</span></label>
            <label className="check-item"><input name="consent_policy" type="checkbox" required /><span>I agree to the studio&apos;s booking policy and consent to the service being performed.</span></label>
            <label>Digital signature<input name="signature" required /></label>
          </div>
        )}
        {message && <p className="form-status">{message}</p>}
        <button className="btn-primary" disabled={!selectedSlot}>Request Booking</button>
      </form>
    </section>
  );
}
