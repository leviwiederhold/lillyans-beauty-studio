"use client";

import { useState, useMemo } from "react";
import { ADDRESS } from "@/lib/constants";

type Service = {
  id: string;
  name: string;
  description?: string;
  service_total?: number;
  duration_minutes: number;
  requires_intake: boolean;
  requires_deposit: boolean;
  deposit_amount_cents?: number;
  intake_type?: string;
  service_categories?: { name: string } | null;
};

type IntakeForm = { id: string; type?: string; service_label?: string; created_at: string };

const STEPS = ["Service", "Date & Time", "Intake", "Code", "Confirm"];

function Stepper({ step }: { step: number }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <div key={label} className="step-item" style={i === STEPS.length - 1 ? { flex: "none" } : undefined}>
            <div className="step-col">
              <div className={`step-circle${done ? " done" : current ? " current" : ""}`}>{done ? "✓" : i + 1}</div>
              <div className={`step-label-txt${current ? " current" : ""}`}>{label}</div>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line${done ? " done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function BookingFlow({ services, intakeForms }: { services: Service[]; intakeForms: IntakeForm[] }) {
  const today = new Date();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [codeMsg, setCodeMsg] = useState("");
  const [submitMsg, setSubmitMsg] = useState("");
  const [done, setDone] = useState(false);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const depositCents = service?.deposit_amount_cents ?? (service?.service_total ? Math.round(service.service_total * 0.2) : 0);
  const remainingCents = service?.service_total ? service.service_total - depositCents : 0;

  const intakeOnFile = useMemo(() => {
    if (!service?.requires_intake) return true;
    return intakeForms.some((f) => f.type === service.intake_type || f.service_label?.toLowerCase().includes(service.name.toLowerCase().split(" ")[0]));
  }, [service, intakeForms]);

  async function loadSlots(dateStr: string, sid = serviceId) {
    setSelectedDate(dateStr);
    setSelectedSlot("");
    setSlots([]);
    setSlotsMsg("Checking availability…");
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/availability?service_id=${sid}&date=${dateStr}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setSlotsMsg(data.slots?.length ? "" : "No available times for this date. Try another day.");
    } catch {
      setSlotsMsg("Could not load availability. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function applyCode() {
    if (!code.trim()) return;
    setCodeMsg("Checking code…");
    try {
      const res = await fetch(`/api/gift-card/validate?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (data.valid) {
        setCodeStatus("valid");
        setCodeMsg(data.message || "Code applied — deposit waived.");
      } else {
        setCodeStatus("invalid");
        setCodeMsg(data.message || "Code not found or expired.");
      }
    } catch {
      setCodeStatus("invalid");
      setCodeMsg("Could not verify code.");
    }
  }

  async function confirm() {
    setSubmitMsg("Submitting booking request…");
    const payload = {
      service_id: serviceId,
      starts_at: selectedSlot,
      gift_card_code: codeStatus === "valid" ? code.trim() : undefined
    };
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { setSubmitMsg(data.error || "Could not create booking."); return; }
      if (data.square_checkout_url) { window.location.assign(data.square_checkout_url); return; }
      setDone(true);
    } catch {
      setSubmitMsg("An error occurred. Please try again.");
    }
  }

  if (services.length === 0) {
    return (
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-body">
          <p style={{ color: "var(--grey-mid)" }}>No services available for online booking yet. Please contact the studio.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card" style={{ marginTop: "1.5rem", maxWidth: 560, margin: "1.5rem auto 0" }}>
        <div className="card-header" style={{ background: "var(--black)" }}>
          <span className="card-title" style={{ color: "#fff" }}>Booking Received</span>
        </div>
        <div className="card-body">
          <div className="intake-status complete" style={{ marginBottom: "1rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Your booking request has been submitted.
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>Lilly will confirm your appointment shortly. You&apos;ll receive a notification once it&apos;s confirmed.</p>
          <a href="/account/bookings" className="btn btn-pink btn-sm">View My Bookings</a>
        </div>
      </div>
    );
  }

  const { firstDay, daysInMonth } = getMonthDays(calYear, calMonth);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Stepper step={step} />
      <div className="g2" style={{ gap: "1.5rem", alignItems: "start" }}>
        {/* LEFT COLUMN */}
        <div>
          {/* STEP 1 — SERVICE */}
          {step === 0 ? (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="card-header">
                <span className="card-title" style={{ fontSize: "1rem" }}>Choose a Service</span>
              </div>
              <div className="card-body">
                <div className="service-options">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      className={`service-option${serviceId === s.id ? " selected" : ""}`}
                      onClick={() => setServiceId(s.id)}
                    >
                      <div className="service-option-name">{s.name}</div>
                      <div className="service-option-price">
                        {s.service_total ? `$${(s.service_total / 100).toFixed(0)}` : "Inquire"}
                      </div>
                      {s.service_categories?.name && <div className="service-option-note">{s.service_categories.name}</div>}
                      {s.requires_intake && <div className="intake-flag">✦ Intake required</div>}
                    </div>
                  ))}
                </div>
                <button className="btn btn-pink" onClick={() => setStep(1)}>Continue — {service?.name}</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="card-header" style={{ background: "var(--border-light)" }}>
                <span className="card-title" style={{ fontSize: "1rem" }}>Service Selected</span>
                <span className="badge badge-pink">✓ Done</span>
              </div>
              <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: 2 }}>{service?.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--grey-mid)" }}>{service?.duration_minutes} min</div>
                  {service?.requires_intake && <div className="intake-flag">✦ Intake form required</div>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>Change</button>
              </div>
            </div>
          )}

          {/* STEP 2 — DATE */}
          {step >= 1 && (
            <>
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: "1rem" }}>Choose Date</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--grey-mid)" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(calYear, calMonth - 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}>‹ Prev</button>
                    <strong style={{ color: "var(--black)", whiteSpace: "nowrap" }}>{MONTH_NAMES[calMonth]} {calYear}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(calYear, calMonth + 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}>Next ›</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="cal-grid">
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <div key={d} className="cal-header-cell">{d}</div>)}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isPast = new Date(`${dateStr}T23:59:59`) < today;
                      const isSelected = dateStr === selectedDate;
                      const isToday = dateStr === today.toISOString().slice(0, 10);
                      return (
                        <div
                          key={day}
                          className={`cal-day${isPast ? " disabled" : ""}${isSelected ? " selected" : ""}${isToday && !isSelected ? " today-mark" : ""}`}
                          onClick={() => { if (!isPast) { loadSlots(dateStr); if (step === 1) setStep(2); } }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <div className="card-header">
                    <span className="card-title" style={{ fontSize: "1rem" }}>Available Times — {formatDate(new Date(`${selectedDate}T12:00:00`))}</span>
                  </div>
                  <div className="card-body">
                    {slotsLoading && <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>Loading…</p>}
                    {!slotsLoading && slotsMsg && <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>{slotsMsg}</p>}
                    {!slotsLoading && slots.length > 0 && (
                      <div className="time-slots">
                        {slots.map((slot) => (
                          <div
                            key={slot}
                            className={`time-slot${selectedSlot === slot ? " selected" : ""}`}
                            onClick={() => { setSelectedSlot(slot); if (step === 2 && service?.requires_intake) setStep(2); }}
                          >
                            {formatTime(slot)}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedSlot && (
                      <div style={{ marginTop: "1rem" }}>
                        <button className="btn btn-pink btn-sm" onClick={() => setStep(service?.requires_intake ? 2 : 3)}>Continue</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3 — INTAKE */}
          {step >= 2 && service?.requires_intake && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="card-header">
                <span className="card-title" style={{ fontSize: "1rem" }}>Medical Intake Form</span>
              </div>
              <div className="card-body">
                {intakeOnFile ? (
                  <>
                    <div className="intake-status complete">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Intake form on file
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--grey-mid)", marginBottom: "0.8rem" }}>Has anything changed since your last visit?</p>
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>No changes — use same form</button>
                      <a href="/account/intake" className="btn btn-app-outline btn-sm">Update my form</a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="intake-status pending">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                      Intake form required before your appointment
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--grey-mid)", marginBottom: "0.8rem" }}>Please complete your intake form. You can still request the booking now and submit the form from your account.</p>
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>Continue anyway</button>
                      <a href="/account/intake" className="btn btn-pink btn-sm">Complete Form Now</a>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 — GIFT CARD / CODE */}
          {step >= 3 && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="card-header">
                <span className="card-title" style={{ fontSize: "1rem" }}>Gift Card or Deposit Code</span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: "0.78rem", color: "var(--grey-mid)", marginBottom: "0.8rem" }}>Have a gift card or code that waives the deposit? Enter it below.</p>
                <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <input
                    className="field-input"
                    style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}
                    placeholder="XXXX-XXXX-XXXX"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setCodeStatus("idle"); setCodeMsg(""); }}
                  />
                  <button className="btn btn-pink btn-sm" style={{ whiteSpace: "nowrap" }} onClick={applyCode}>Apply Code</button>
                </div>
                {codeMsg && (
                  <p style={{ fontSize: "0.75rem", color: codeStatus === "valid" ? "var(--success)" : codeStatus === "invalid" ? "#9b1c31" : "var(--grey-mid)" }}>
                    {codeMsg}
                  </p>
                )}
                <button className="btn btn-ghost btn-sm" style={{ marginTop: "0.8rem" }} onClick={() => setStep(4)}>Skip — no code</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — BOOKING SUMMARY */}
        <div>
          <div className="card" style={{ position: "sticky", top: 80 }}>
            <div className="card-header" style={{ background: "var(--black)" }}>
              <span className="card-title" style={{ color: "#fff", fontSize: "1rem" }}>Booking Summary</span>
            </div>
            <div className="card-body">
              <div className="order-row">
                <span style={{ color: "var(--grey-mid)" }}>Service</span>
                <span>{service?.name || "—"}</span>
              </div>
              <div className="order-row">
                <span style={{ color: "var(--grey-mid)" }}>Date</span>
                <span>{selectedDate ? formatDate(new Date(`${selectedDate}T12:00:00`)) : "—"}</span>
              </div>
              <div className="order-row">
                <span style={{ color: "var(--grey-mid)" }}>Time</span>
                <span>{selectedSlot ? formatTime(selectedSlot) : "—"}</span>
              </div>
              <div className="order-row">
                <span style={{ color: "var(--grey-mid)" }}>Duration</span>
                <span>{service ? `${service.duration_minutes} min` : "—"}</span>
              </div>
              <div className="order-row">
                <span style={{ color: "var(--grey-mid)" }}>Location</span>
                <span style={{ textAlign: "right", fontSize: "0.78rem" }}>{ADDRESS}</span>
              </div>
              {service?.service_total ? (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "0.8rem 0" }} />
                  <div className="order-row">
                    <span style={{ color: "var(--grey-mid)" }}>Service total</span>
                    <span>${(service.service_total / 100).toFixed(2)}</span>
                  </div>
                  {service.requires_deposit && codeStatus !== "valid" ? (
                    <>
                      <div className="order-row deposit">
                        <span>Deposit due today (20%)</span>
                        <span>${(depositCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="order-row" style={{ color: "var(--grey-mid)", fontSize: "0.75rem" }}>
                        <span>Remaining balance</span>
                        <span>${(remainingCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="order-row total" style={{ paddingTop: "0.8rem", borderTop: "1.5px solid var(--border)" }}>
                        <span>Due today</span>
                        <span style={{ color: "var(--pink-dark)" }}>${(depositCents / 100).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="order-row total" style={{ paddingTop: "0.8rem", borderTop: "1.5px solid var(--border)" }}>
                      <span>Due today</span>
                      <span style={{ color: "var(--pink-dark)" }}>$0.00 {codeStatus === "valid" ? "(code applied)" : ""}</span>
                    </div>
                  )}
                </>
              ) : null}

              {submitMsg && <p style={{ fontSize: "0.78rem", color: "var(--grey-mid)", marginBottom: "0.8rem" }}>{submitMsg}</p>}

              {step >= 3 && selectedSlot ? (
                <>
                  <button
                    className="btn btn-pink btn-full"
                    style={{ marginBottom: "0.6rem", marginTop: "1rem" }}
                    onClick={() => { setStep(4); confirm(); }}
                  >
                    {service?.requires_deposit && codeStatus !== "valid" && depositCents > 0
                      ? `Confirm & Pay Deposit — $${(depositCents / 100).toFixed(2)}`
                      : "Confirm Booking Request"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: "0.65rem", color: "var(--grey-light)" }}>Secured · Encrypted · No contracts</p>
                </>
              ) : (
                <p style={{ fontSize: "0.78rem", color: "var(--grey-light)", marginTop: "1rem" }}>Complete the steps on the left to confirm.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
