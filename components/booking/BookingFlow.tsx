"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  service_total?: number | null;
  requires_intake?: boolean;
  intake_type?: string | null;
  requires_deposit?: boolean;
  service_categories?: { name?: string | null } | null;
};

type Client = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type AvailabilityResponse = { slots?: string[]; error?: string };
type BookingResponse = { error?: string; square_checkout_url?: string; booking?: { deposit_status?: string; status?: string }; requires_intake?: boolean };

const steps = ["Service", "Date", "Time", "Details", "Deposit"];

function money(cents?: number | null) {
  if (!cents) return "Set by studio";
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function dateLabel(value: string) {
  if (!value) return "Choose a date";
  return new Date(`${value}T12:00:00`).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingFlow({ services, categories, client, squareEnabled }: { services: Service[]; categories: Record<string, unknown>[]; client: Client | null; squareEnabled: boolean }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [message, setMessage] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const service = services.find((s) => s.id === serviceId);
  const serviceTotal = Number(service?.service_total || 0);
  const depositAmount = serviceTotal > 0 ? Math.round(serviceTotal * 0.2) : 0;
  const remaining = Math.max(serviceTotal - depositAmount, 0);
  const giftCodeEntered = giftCode.trim().length > 0;
  const squareBlocked = Boolean(service && depositAmount > 0 && !squareEnabled && !giftCodeEntered);
  const activeStep = !service ? 0 : !date ? 1 : !selectedSlot ? 2 : 3;

  const groupedServices = useMemo(() => {
    const groups = new Map<string, Service[]>();
    for (const item of services) {
      const group = item.service_categories?.name || "Services";
      groups.set(group, [...(groups.get(group) || []), item]);
    }
    return Array.from(groups.entries());
  }, [services]);

  async function loadSlots(nextDate: string, nextService = serviceId) {
    setDate(nextDate);
    setSelectedSlot("");
    setSlots([]);
    if (!nextDate || !nextService) return;
    setLoadingSlots(true);
    setMessage("Checking availability...");
    const res = await fetch(`/api/availability?service_id=${nextService}&date=${nextDate}`);
    const data = await res.json() as AvailabilityResponse;
    setLoadingSlots(false);
    if (!res.ok) {
      setMessage(data.error || "Could not load available times.");
      return;
    }
    setSlots(data.slots || []);
    setMessage(data.slots?.length ? "" : "No available times for that date. Try another day.");
  }

  function selectService(id: string) {
    setServiceId(id);
    setSelectedSlot("");
    setSlots([]);
    setMessage("");
    if (date) void loadSlots(date, id);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot || !service) {
      setMessage("Choose a service, date, and time before continuing.");
      return;
    }
    if (squareBlocked) {
      setMessage("Deposit payments are not configured yet. Enter a valid gift card/no-deposit code or contact the studio.");
      return;
    }

    setSubmitting(true);
    setMessage("Creating your booking...");
    const fd = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(fd.entries()), service_id: serviceId, starts_at: selectedSlot, gift_card_code: giftCode };
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json() as BookingResponse;
    setSubmitting(false);
    if (!res.ok) {
      setMessage(data.error || "Could not create booking.");
      return;
    }
    if (data.square_checkout_url) {
      setMessage("Opening Square checkout for your 20% deposit...");
      window.location.assign(data.square_checkout_url);
      return;
    }
    setMessage(data.booking?.deposit_status === "waived" ? "Your gift card/code was accepted. Your booking request has been sent." : "Booking request saved. Lilly will follow up with next steps.");
  }

  if (services.length === 0) {
    return <section className="booking-card booking-empty"><p>No services are available for online booking yet. Please contact the studio.</p></section>;
  }

  return (
    <section className="booking-experience">
      <div className="booking-steps" aria-label="Booking progress">
        {steps.map((step, index) => <span key={step} className={index <= activeStep ? "active" : ""}>{index + 1}. {step}</span>)}
      </div>

      <div className="booking-layout">
        <div className="booking-main">
          <section className="booking-card">
            <div className="booking-card-head"><p className="booking-kicker">Step 1</p><h2>Choose a Service</h2></div>
            <div className="booking-service-groups">
              {groupedServices.map(([group, items]) => (
                <div key={group} className="booking-service-group">
                  {categories.length > 0 && <p>{group}</p>}
                  <div className="booking-service-list">
                    {items.map((item) => (
                      <button key={item.id} type="button" className={item.id === serviceId ? "booking-service active" : "booking-service"} onClick={() => selectService(item.id)}>
                        <strong>{item.name}</strong>
                        <span>{item.duration_minutes} min · {money(item.service_total)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {service && <p className="booking-muted">{service.description || "Details are managed by the studio."}</p>}
          </section>

          <section className="booking-card">
            <div className="booking-card-head"><p className="booking-kicker">Step 2</p><h2>Choose Date & Time</h2></div>
            <div className="booking-date-row">
              <label>Date<input type="date" min={today()} value={date} onChange={(e) => loadSlots(e.target.value)} /></label>
              <div className="booking-date-summary"><strong>{dateLabel(date)}</strong><span>{service ? `${service.duration_minutes} minute appointment` : "Select a service first"}</span></div>
            </div>
            <div className="booking-slots" aria-live="polite">
              {loadingSlots && <p className="booking-muted">Checking open times...</p>}
              {!loadingSlots && slots.map((slot) => <button type="button" className={selectedSlot === slot ? "booking-slot active" : "booking-slot"} onClick={() => setSelectedSlot(slot)} key={slot}>{timeLabel(slot)}</button>)}
              {!loadingSlots && date && slots.length === 0 && <p className="booking-muted">No open times found for this date.</p>}
            </div>
          </section>

          <form className="booking-card booking-form" onSubmit={submit}>
            <div className="booking-card-head"><p className="booking-kicker">Step 3</p><h2>Confirm Details</h2></div>
            <input className="hp" name="website" tabIndex={-1} autoComplete="off" />
            <div className="booking-fields">
              <label>First name<input name="first_name" required defaultValue={client?.first_name || ""} /></label>
              <label>Last name<input name="last_name" defaultValue={client?.last_name || ""} /></label>
              <label>Email<input name="email" type="email" required defaultValue={client?.email || ""} /></label>
              <label>Phone<input name="phone" defaultValue={client?.phone || ""} /></label>
            </div>
            <label>Gift card / no-deposit code<input name="gift_card_code_visible" value={giftCode} onChange={(e) => setGiftCode(e.target.value)} placeholder="Optional" /></label>
            <label>Notes<textarea name="notes" placeholder="Anything Lilly should know before the appointment?"></textarea></label>

            {service?.requires_intake && (
              <div className="booking-intake-card">
                <p className="booking-kicker">Required Intake</p>
                <h3>{service.name} Intake</h3>
                <label>Current medications<textarea name="medications" required placeholder="List all or write None"></textarea></label>
                <label>Known allergies<textarea name="allergies" required placeholder="Medications, foods, latex, skincare ingredients, or None"></textarea></label>
                <label>Skin conditions / sensitivities<textarea name="skin_conditions" placeholder="Eczema, rosacea, acne, sensitive skin..."></textarea></label>
                <label>Previous procedures<textarea name="previous_procedures" placeholder="Prior PMU, fillers, Botox, laser, or None"></textarea></label>
                <label className="check-item"><input name="consent_accuracy" type="checkbox" required /><span>I confirm all information provided is accurate and complete.</span></label>
                <label className="check-item"><input name="consent_updates" type="checkbox" required /><span>I will inform Lillyan&apos;s Beauty Studio of any health changes before future appointments.</span></label>
                <label className="check-item"><input name="consent_policy" type="checkbox" required /><span>I agree to the studio&apos;s booking policy and consent to the service being performed.</span></label>
                <label>Digital signature<input name="signature" required placeholder="Type your full legal name" /></label>
              </div>
            )}

            {message && <p className={message.includes("not configured") || message.includes("Could not") || message.includes("not found") ? "form-status error" : "form-status success"}>{message}</p>}
            <button className="btn-primary" disabled={!selectedSlot || submitting || squareBlocked}>{submitting ? "Submitting..." : squareBlocked ? "Deposit Payments Not Configured" : "Continue to Deposit"}</button>
          </form>
        </div>

        <aside className="booking-summary">
          <section className="booking-card sticky-summary">
            <p className="booking-kicker">Deposit Summary</p>
            <h2>{service?.name || "Select a service"}</h2>
            <dl>
              <div><dt>Service total</dt><dd>{money(serviceTotal)}</dd></div>
              <div><dt>20% deposit due today</dt><dd>{giftCodeEntered ? "Validated after submit" : money(depositAmount)}</dd></div>
              <div><dt>Remaining balance</dt><dd>{giftCodeEntered ? "Due in person if applicable" : money(remaining)}</dd></div>
            </dl>
            {service?.requires_intake && <p className="booking-notice">This service requires intake before booking is submitted.</p>}
            {squareBlocked && <p className="booking-notice error">Deposit payments are not configured yet. Gift card/no-deposit codes can still be validated.</p>}
            <p className="booking-muted">Booking is confirmed only after the deposit is paid through Square or a valid gift card/no-deposit code waives the deposit.</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
