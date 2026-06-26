"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { ADDRESS } from "@/lib/constants";
import { requiredFormsForCategory } from "@/lib/intake";
import ServiceSelection from "./ServiceSelection";
import IntakeStep from "@/components/forms/IntakeStep";

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

type ExistingFormType = { form_type: string; submitted_at: string };
type Category = { name: string; services: Service[] };

const STEPS = ["Service", "Date & Time", "Intake", "Code", "Confirm"];

function Stepper({ step }: { step: number }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <div key={label} className="step-item">
            <div className="step-col">
              <div className={`step-circle${done ? " done" : current ? " current" : ""}`}>
                {done ? "✓" : i + 1}
              </div>
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

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function BookingFlow({
  services,
  existingFormTypes = [],
  userEmail = "",
  userFirstName = "",
  userLastName = "",
  userPhone = "",
  userId = "",
}: {
  services: Service[];
  existingFormTypes?: ExistingFormType[];
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userPhone?: string;
  userId?: string;
}) {
  const today = new Date();

  // Group services by category
  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>();
    for (const s of services) {
      const catName = s.service_categories?.name ?? "Other";
      if (!map.has(catName)) map.set(catName, { name: catName, services: [] });
      map.get(catName)!.services.push(s);
    }
    return Array.from(map.values());
  }, [services]);

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);

  function goTo(next: number) {
    setDirection(next > step ? "forward" : "backward");
    setAnimKey((k) => k + 1);
    setStep(next);
  }

  // ── Booking data state ──────────────────────────────────────────────────
  const [serviceId, setServiceId] = useState("");
  const [selectedServiceInfo, setSelectedServiceInfo] = useState<{
    name: string; price: string; duration: string; category: string;
  } | null>(null);
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
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const depositCents = service?.deposit_amount_cents ?? (service?.service_total ? Math.round(service.service_total * 0.2) : 0);
  const remainingCents = service?.service_total ? service.service_total - depositCents : 0;

  // ── API helpers ─────────────────────────────────────────────────────────
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

  // ── Real-time slot refresh: poll every 30s while on Step 1 (date/time) ──
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (step === 1 && selectedDate && serviceId) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/availability?service_id=${serviceId}&date=${selectedDate}`);
          const data = await res.json();
          const fresh: string[] = data.slots || [];
          setSlots(fresh);
          // If the selected slot was just booked by someone else, clear it
          if (selectedSlot && !fresh.includes(selectedSlot)) {
            setSelectedSlot("");
            setSlotsMsg("That time is no longer available. Please select another.");
          }
        } catch {
          // Silently ignore polling errors
        }
      }, 30000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, selectedDate, serviceId, selectedSlot]);

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
    if (confirming) return;
    setConfirming(true);
    setSubmitMsg("Submitting…");
    const payload = {
      service_id: serviceId,
      starts_at: selectedSlot,
      first_name: userFirstName || userEmail.split("@")[0],
      last_name: userLastName || undefined,
      email: userEmail,
      phone: userPhone || undefined,
      gift_card_code: codeStatus === "valid" ? code.trim() : undefined,
    };
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Session expired → redirect to login
        if (res.status === 401) {
          window.location.assign("/login?next=/book");
          return;
        }
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.error
            ? JSON.stringify(data.error)
            : "Could not create booking.";
        setSubmitMsg(errMsg);
        setConfirming(false);
        // 409 = slot just taken — send back to date/time step and refresh slots
        if (res.status === 409) {
          setSelectedSlot("");
          if (selectedDate && serviceId) loadSlots(selectedDate, serviceId);
          goTo(1);
        }
        return;
      }
      if (data.square_checkout_url) {
        window.location.assign(data.square_checkout_url);
        return;
      }
      setDone(true);
    } catch {
      setSubmitMsg("An error occurred. Please try again.");
      setConfirming(false);
    }
  }

  // ── Calendar helpers ────────────────────────────────────────────────────
  const { firstDay, daysInMonth } = getMonthDays(calYear, calMonth);

  // ── Empty / done states ─────────────────────────────────────────────────
  if (services.length === 0) {
    return (
      <div className="bk-outer">
        <div className="bk-step-pad">
          <p style={{ color: "var(--grey-mid)" }}>
            No services available for online booking yet. Please contact the studio.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bk-outer">
          <div className="bk-step-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="bk-step-eyebrow">Booking Received</div>
            <h2 className="bk-step-title">You&apos;re all set!</h2>
            <p className="bk-step-sub">Lilly will confirm your appointment shortly.</p>
            <div className="bk-confirm-card" style={{ marginTop: "1.25rem" }}>
              <div className="bk-confirm-row">
                <span className="bk-confirm-label">Service</span>
                <span className="bk-confirm-val">{service?.name}</span>
              </div>
              <div className="bk-confirm-row">
                <span className="bk-confirm-label">Date &amp; Time</span>
                <span className="bk-confirm-val">
                  {selectedDate ? formatDate(new Date(`${selectedDate}T12:00:00`)) : "—"}{selectedSlot ? ` at ${formatTime(selectedSlot)}` : ""}
                </span>
              </div>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.6rem" }}>
              <Link href="/account/bookings" className="btn btn-pink btn-sm" style={{ textDecoration: "none" }}>
                View My Bookings
              </Link>
              <Link href="/" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
                Back to Studio
              </Link>
            </div>
          </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="bk-outer">

        {/* Step progress bar */}
        <div className="bk-stepper-wrap">
          <Stepper step={step} />
        </div>

        {/* Slide viewport — animates on each step change */}
        <div className="bk-slide-wrap">
          <div key={animKey} className={`bk-step-pad bk-anim-${direction}`}>

            {/* ── STEP 0: Service ───────────────────────────────────────── */}
            {step === 0 && (
              <ServiceSelection
                onNext={(selected) => {
                  setSelectedServiceInfo({
                    name: selected.name,
                    price: selected.price,
                    duration: selected.duration,
                    category: selected.category,
                  });
                  const match =
                    services.find((s) => s.name.toLowerCase() === selected.name.toLowerCase()) ??
                    services.find((s) =>
                      s.name.toLowerCase().includes(selected.name.toLowerCase().split(" ")[0])
                    );
                  if (match) setServiceId(match.id);
                  goTo(1);
                }}
              />
            )}

            {/* ── STEP 1: Date & Time ───────────────────────────────────── */}
            {step === 1 && (
              <>
                <div className="bk-step-eyebrow">Step 2 of 5</div>
                <h2 className="bk-step-title">Date &amp; Time</h2>
                <p className="bk-step-sub">Pick your appointment date and available time</p>

                <div className="bk-step2-side">
                  {/* Calendar */}
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title" style={{ fontSize: "0.9rem" }}>Choose Date</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const d = new Date(calYear, calMonth - 1);
                            setCalYear(d.getFullYear());
                            setCalMonth(d.getMonth());
                          }}
                        >
                          ‹
                        </button>
                        <strong style={{ fontSize: "0.78rem", color: "var(--black)", whiteSpace: "nowrap" }}>
                          {MONTH_NAMES[calMonth]} {calYear}
                        </strong>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const d = new Date(calYear, calMonth + 1);
                            setCalYear(d.getFullYear());
                            setCalMonth(d.getMonth());
                          }}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="cal-grid">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d} className="cal-header-cell">{d}</div>
                        ))}
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
                              onClick={() => {
                                if (!isPast) loadSlots(dateStr);
                              }}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title" style={{ fontSize: "0.9rem" }}>
                        {selectedDate
                          ? `Times — ${formatDate(new Date(`${selectedDate}T12:00:00`))}`
                          : "Available Times"}
                      </span>
                    </div>
                    <div className="card-body">
                      {!selectedDate && (
                        <p style={{ fontSize: "0.8rem", color: "var(--grey-light)" }}>
                          Select a date to see available times.
                        </p>
                      )}
                      {slotsLoading && (
                        <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>Loading…</p>
                      )}
                      {!slotsLoading && slotsMsg && (
                        <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)" }}>{slotsMsg}</p>
                      )}
                      {!slotsLoading && slots.length > 0 && (
                        <div className="time-slots">
                          {slots.map((slot) => (
                            <div
                              key={slot}
                              className={`time-slot${selectedSlot === slot ? " selected" : ""}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {formatTime(slot)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: Intake ────────────────────────────────────────── */}
            {step === 2 && selectedServiceInfo && (() => {
              const requiredForms = requiredFormsForCategory(selectedServiceInfo.category);
              const allFormsOnFile = requiredForms.every((ft) =>
                existingFormTypes.some((e) => e.form_type === ft)
              );
              const mostRecentDate = existingFormTypes
                .filter((e) => requiredForms.includes(e.form_type))
                .sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1))[0]?.submitted_at;

              if (allFormsOnFile && mostRecentDate) {
                return (
                  <>
                    <div className="bk-step-eyebrow">Step 3 of 5</div>
                    <h2 className="bk-step-title">Intake Forms</h2>
                    <p className="bk-step-sub">Your health information on file</p>
                    <div className="card" style={{ maxWidth: 500, marginBottom: "1rem" }}>
                      <div className="card-header" style={{ background: "var(--black)" }}>
                        <span className="card-title" style={{ color: "#fff" }}>Forms on File</span>
                        <span className="badge badge-green">✓ Complete</span>
                      </div>
                      <div className="card-body">
                        <div className="intake-status complete" style={{ marginBottom: "1rem" }}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          On file from{" "}
                          {new Date(mostRecentDate).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })}
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
                          No action needed — your forms are current.
                          You can update them from your account any time.
                        </p>
                        <a
                          href="/account/intake"
                          className="btn btn-ghost btn-sm"
                          style={{ textDecoration: "none" }}
                        >
                          Update Forms
                        </a>
                      </div>
                    </div>
                  </>
                );
              }

              return (
                <IntakeStep
                  booking={selectedServiceInfo}
                  userId={userId}
                  bookingId={null}
                  onComplete={() => goTo(3)}
                  onBack={() => goTo(1)}
                />
              );
            })()}

            {/* ── STEP 3: Gift Card / Code ──────────────────────────────── */}
            {step === 3 && (
              <>
                <div className="bk-step-eyebrow">Step 4 of 5</div>
                <h2 className="bk-step-title">Gift Card or Code</h2>
                <p className="bk-step-sub">Have a gift card or no-deposit code? Enter it below.</p>

                <div className="card" style={{ maxWidth: 420 }}>
                  <div className="card-body">
                    <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.5rem" }}>
                      <input
                        className="field-input"
                        style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}
                        placeholder="XXXX-XXXX-XXXX"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setCodeStatus("idle");
                          setCodeMsg("");
                        }}
                      />
                      <button className="btn btn-pink btn-sm" style={{ whiteSpace: "nowrap" }} onClick={applyCode}>
                        Apply
                      </button>
                    </div>
                    {codeMsg && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color:
                            codeStatus === "valid"
                              ? "var(--success)"
                              : codeStatus === "invalid"
                              ? "#9b1c31"
                              : "var(--grey-mid)",
                        }}
                      >
                        {codeMsg}
                      </p>
                    )}
                    <p style={{ fontSize: "0.72rem", color: "var(--grey-light)", marginTop: "0.75rem" }}>
                      Don&apos;t have a code? Use the Continue button below to skip.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 4: Confirm ───────────────────────────────────────── */}
            {step === 4 && (
              <>
                <div className="bk-step-eyebrow">Step 5 of 5</div>
                <h2 className="bk-step-title">Confirm your<br />booking</h2>
                <p className="bk-step-sub">Review the details below and confirm</p>

                <div className="bk-confirm-card">
                  <div className="bk-confirm-row">
                    <span className="bk-confirm-label">Service</span>
                    <span className="bk-confirm-val">{service?.name || "—"}</span>
                  </div>
                  <div className="bk-confirm-row">
                    <span className="bk-confirm-label">Category</span>
                    <span className="bk-confirm-val">{service?.service_categories?.name || "—"}</span>
                  </div>
                  <div className="bk-confirm-row">
                    <span className="bk-confirm-label">Date &amp; Time</span>
                    <span className="bk-confirm-val">
                      {selectedDate
                        ? `${formatDate(new Date(`${selectedDate}T12:00:00`))} at ${formatTime(selectedSlot)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="bk-confirm-row">
                    <span className="bk-confirm-label">Duration</span>
                    <span className="bk-confirm-val">
                      {service ? `${service.duration_minutes >= 60 ? `${Math.floor(service.duration_minutes / 60)} hr${service.duration_minutes % 60 ? ` ${service.duration_minutes % 60} min` : ""}` : `${service.duration_minutes} min`}` : "—"}
                    </span>
                  </div>
                  <div className="bk-confirm-row">
                    <span className="bk-confirm-label">Location</span>
                    <span className="bk-confirm-val" style={{ fontSize: "0.8rem" }}>{ADDRESS}</span>
                  </div>
                  {service?.service_total ? (
                    <>
                      <div className="bk-confirm-row" style={{ borderTop: "1px solid var(--border-light)" }}>
                        <span className="bk-confirm-label">Service total</span>
                        <span className="bk-confirm-val">${(service.service_total / 100).toFixed(2)}</span>
                      </div>
                      {service.requires_deposit && codeStatus !== "valid" ? (
                        <>
                          <div className="bk-confirm-row">
                            <span className="bk-confirm-label" style={{ color: "var(--pink-dark)" }}>Deposit due today (20%)</span>
                            <span className="bk-confirm-val" style={{ color: "var(--pink-dark)" }}>
                              ${(depositCents / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="bk-confirm-row">
                            <span className="bk-confirm-label">Remaining balance</span>
                            <span className="bk-confirm-val">${(remainingCents / 100).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="bk-confirm-row">
                          <span className="bk-confirm-label">Due today</span>
                          <span className="bk-confirm-val" style={{ color: "var(--pink-dark)" }}>
                            $0.00 {codeStatus === "valid" ? "(code applied)" : ""}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {submitMsg && (
                  <p style={{ fontSize: "0.78rem", color: "var(--grey-mid)", marginTop: "1rem" }}>
                    {submitMsg}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Sticky footer — Back / Next / Confirm ──────────────────────── */}
        {/* Hidden on step 0 (ServiceSelection has its own CTA) */}
        {/* Hidden on step 2 (IntakeStep handles its own navigation) */}
        {step !== 0 && step !== 2 && (
          <div className="bk-footer">
            <button className="btn btn-ghost btn-sm" onClick={() => goTo(step - 1)}>
              ← Back
            </button>

            {step === 1 && (
              <button
                className="btn btn-pink btn-sm"
                disabled={!selectedSlot}
                onClick={() => { if (selectedSlot) goTo(2); }}
              >
                Continue →
              </button>
            )}

            {step === 3 && (
              <button className="btn btn-pink btn-sm" onClick={() => goTo(4)}>
                Continue →
              </button>
            )}

            {step === 4 && (
              <button
                onClick={confirm}
                disabled={confirming}
                style={{
                  background: confirming ? "#86efac" : "#22c55e",
                  color: "#fff",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: 10,
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: confirming ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  opacity: confirming ? 0.7 : 1,
                }}
              >
                {confirming ? "Submitting…" : "Confirm Booking"}
                {!confirming && (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}

        {/* On-file "forms" step shows its own Continue in the footer */}
        {step === 2 && selectedServiceInfo && (() => {
          const requiredForms = requiredFormsForCategory(selectedServiceInfo.category);
          const allFormsOnFile = requiredForms.every((ft) =>
            existingFormTypes.some((e) => e.form_type === ft)
          );
          return allFormsOnFile ? (
            <div className="bk-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => goTo(1)}>← Back</button>
              <button className="btn btn-pink btn-sm" onClick={() => goTo(3)}>Continue →</button>
            </div>
          ) : null;
        })()}
    </div>
  );
}
