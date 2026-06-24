"use client";

import { useState } from "react";

type DayRow = { day_of_week: number; name: string; opens_at: string; closes_at: string; is_closed: boolean };

// Weekly schedule + booking settings editor in the AdminUI style. Hours save to
// /api/admin/business-hours (which also syncs availability_rules); booking rules
// save to /api/admin/booking-settings.
export function HoursEditor({ initialHours, minNoticeHours, intakeMonths }: { initialHours: DayRow[]; minNoticeHours: number; intakeMonths: number }) {
  const [hours, setHours] = useState(initialHours);
  const [notice, setNotice] = useState(String(minNoticeHours));
  const [months, setMonths] = useState(String(intakeMonths));
  const [savingHours, setSavingHours] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [msg, setMsg] = useState("");
  const [rulesMsg, setRulesMsg] = useState("");

  function toggle(idx: number) {
    setHours((p) => p.map((h) => h.day_of_week === idx ? { ...h, is_closed: !h.is_closed } : h));
  }
  function setTime(idx: number, field: "opens_at" | "closes_at", value: string) {
    setHours((p) => p.map((h) => h.day_of_week === idx ? { ...h, [field]: value } : h));
  }

  async function saveHours() {
    // Validate open < close for open days.
    for (const h of hours) {
      if (!h.is_closed && h.opens_at >= h.closes_at) { setMsg(`${h.name}: opening time must be before closing time.`); return; }
    }
    setSavingHours(true); setMsg("");
    const res = await fetch("/api/admin/business-hours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hours }) });
    setSavingHours(false);
    setMsg(res.ok ? "Hours saved." : "Could not save hours.");
  }

  async function saveRules() {
    setSavingRules(true); setRulesMsg("");
    const res = await fetch("/api/admin/booking-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ booking_minimum_notice_hours: Number(notice), intake_expiration_months: Number(months) }) });
    setSavingRules(false);
    setRulesMsg(res.ok ? "Saved." : "Could not save.");
  }

  return (
    <div className="two-col">
      <div className="col-stack">
        <div className="card">
          <div className="card-hdr"><span className="card-hdr-title">Weekly Schedule</span></div>
          <div className="card-body">
            {hours.map((h) => (
              <div key={h.day_of_week} className="sched-row">
                <div className="sched-day">{h.name}</div>
                <button type="button" className={`toggle${h.is_closed ? "" : " on"}`} style={{ marginRight: 10 }} onClick={() => toggle(h.day_of_week)} aria-label={h.is_closed ? "Closed" : "Open"} />
                {h.is_closed ? (
                  <div className="sched-closed">Closed</div>
                ) : (
                  <div className="sched-time">
                    <input type="time" className="time-input" value={h.opens_at} onChange={(e) => setTime(h.day_of_week, "opens_at", e.target.value)} />
                    <span style={{ color: "var(--ink3)" }}>to</span>
                    <input type="time" className="time-input" value={h.closes_at} onChange={(e) => setTime(h.day_of_week, "closes_at", e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-primary" onClick={saveHours} disabled={savingHours}>{savingHours ? "Saving…" : "Save hours"}</button>
          {msg && <span style={{ fontSize: 12, color: "var(--ink3)" }}>{msg}</span>}
        </div>
      </div>

      <div className="col-stack">
        <div className="card">
          <div className="card-hdr"><span className="card-hdr-title">Booking Settings</span></div>
          <div className="card-body">
            <div className="f-row">
              <label className="f-label">Minimum booking notice (hours)</label>
              <input className="f-input" type="number" min={0} max={720} value={notice} onChange={(e) => setNotice(e.target.value)} />
            </div>
            <div className="f-row" style={{ marginBottom: 0 }}>
              <label className="f-label">Intake form freshness (months)</label>
              <input className="f-input" type="number" min={0} max={60} value={months} onChange={(e) => setMonths(e.target.value)} />
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-primary" onClick={saveRules} disabled={savingRules}>{savingRules ? "Saving…" : "Save settings"}</button>
            {rulesMsg && <span style={{ fontSize: 12, color: "var(--ink3)" }}>{rulesMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
