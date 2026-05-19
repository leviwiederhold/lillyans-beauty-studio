"use client";

import { useState } from "react";

type DayRow = { day_of_week: number; name: string; opens_at: string; closes_at: string; is_closed: boolean };

export function BusinessHoursEditor({ initialHours }: { initialHours: DayRow[] }) {
  const [hours, setHours] = useState(initialHours);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  function toggle(idx: number) {
    setHours((prev) => prev.map((h) => h.day_of_week === idx ? { ...h, is_closed: !h.is_closed } : h));
  }

  function setTime(idx: number, field: "opens_at" | "closes_at", value: string) {
    setHours((prev) => prev.map((h) => h.day_of_week === idx ? { ...h, [field]: value } : h));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/business-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("Hours saved.");
        setWarnings(body.warnings ?? []);
      } else {
        setMsg("Could not save hours.");
        setWarnings([]);
      }
    } catch {
      setMsg("Error saving hours.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {hours.map((h) => (
        <div key={h.day_of_week} className="hours-row">
          <span className="hours-day">{h.name}</span>
          <button
            type="button"
            className={`hours-toggle${h.is_closed ? "" : " on"}`}
            onClick={() => toggle(h.day_of_week)}
            aria-label={h.is_closed ? "Closed" : "Open"}
          />
          {h.is_closed ? (
            <span style={{ fontSize: "0.75rem", color: "var(--grey-light)" }}>Closed</span>
          ) : (
            <div className="hours-time">
              <input
                type="time"
                className="field-input"
                style={{ width: 110, padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
                value={h.opens_at}
                onChange={(e) => setTime(h.day_of_week, "opens_at", e.target.value)}
              />
              <span style={{ color: "var(--grey-light)" }}>to</span>
              <input
                type="time"
                className="field-input"
                style={{ width: 110, padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
                value={h.closes_at}
                onChange={(e) => setTime(h.day_of_week, "closes_at", e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
        <button className="btn btn-pink btn-sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Hours"}</button>
        {msg && <span style={{ fontSize: "0.78rem", color: "var(--grey-mid)" }}>{msg}</span>}
      </div>
      {warnings.length > 0 && (
        <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#fef3c7", borderRadius: 6, border: "1px solid #f59e0b" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#92400e", marginBottom: "0.4rem" }}>
            ⚠️ The following existing bookings are outside the new hours and may need to be rescheduled:
          </p>
          <ul style={{ fontSize: "0.78rem", color: "#92400e", paddingLeft: "1.2rem" }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}
