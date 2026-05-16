"use client";

import { useState } from "react";

type DayRow = { day_of_week: number; name: string; opens_at: string; closes_at: string; is_closed: boolean };

export function BusinessHoursEditor({ initialHours }: { initialHours: DayRow[] }) {
  const [hours, setHours] = useState(initialHours);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
      setMsg(res.ok ? "Hours saved." : "Could not save hours.");
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
    </>
  );
}
