"use client";

import { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput, EventDropArg } from "@fullcalendar/core";

type Booking = Record<string, unknown>;
type BlockedTime = { id: string; starts_at: string; ends_at: string; reason?: string };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#4a9e6e",
  pending: "#d4a017",
  pending_admin_confirmation: "#c97a1a",
  completed: "#6b7280",
  cancelled: "#9ca3af",
  denied: "#9ca3af",
  "no-show": "#ef4444",
};

export function AdminCalendarView({
  bookings,
  blockedTimes,
}: {
  bookings: Booking[];
  blockedTimes: BlockedTime[];
}) {
  const [selected, setSelected] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");

  const events: EventInput[] = [
    ...bookings
      .filter((b) => b.starts_at)
      .map((b) => ({
        id: String(b.id),
        title: `${String(b.service_type || "")}${b.client_name ? ` — ${String(b.client_name)}` : ""}`,
        start: String(b.starts_at),
        end: b.ends_at ? String(b.ends_at) : undefined,
        backgroundColor: STATUS_COLORS[String(b.status)] ?? "#a78bba",
        borderColor: STATUS_COLORS[String(b.status)] ?? "#a78bba",
        extendedProps: { booking: b },
      })),
    ...blockedTimes.map((bt) => ({
      id: `blocked-${bt.id}`,
      title: bt.reason || "Blocked",
      start: bt.starts_at,
      end: bt.ends_at,
      display: "background",
      backgroundColor: "#fca5a5",
    })),
  ];

  const handleEventClick = useCallback((info: EventClickArg) => {
    const booking = info.event.extendedProps?.booking as Booking | undefined;
    if (booking) setSelected(booking);
  }, []);

  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const booking = info.event.extendedProps?.booking as Booking | undefined;
    if (!booking) return;
    setMessage("Rescheduling…");
    const newStart = info.event.start?.toISOString();
    const newEnd = info.event.end?.toISOString();
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: booking.id,
        starts_at: newStart,
        ends_at: newEnd,
      }),
    });
    const body = await res.json();
    if (res.ok) {
      setMessage("Booking rescheduled. Client notified.");
    } else {
      setMessage(body.error || "Could not reschedule.");
      info.revert();
    }
  }, []);

  async function updateStatus(status: string) {
    if (!selected) return;
    setMessage("Updating…");
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: selected.id, status }),
    });
    const body = await res.json();
    if (res.ok) {
      setMessage(`Status set to ${status}.`);
      setSelected((prev) => prev ? { ...prev, status } : null);
    } else {
      setMessage(body.error || "Update failed.");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px" : "1fr", gap: "1rem", alignItems: "start" }}>
      <div className="admin-card" style={{ padding: "1rem" }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          droppable={false}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={(arg) => handleEventDrop(arg as unknown as EventDropArg)}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
        />
        {message && <p className="admin-message" style={{ marginTop: "0.5rem" }}>{message}</p>}
      </div>

      {selected && (
        <div className="admin-card" style={{ padding: "1.25rem", position: "sticky", top: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Booking Detail</h3>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--grey-mid)" }}
              aria-label="Close"
            >×</button>
          </div>
          <dl style={{ fontSize: "0.82rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.3rem 0.75rem" }}>
            <dt style={{ color: "var(--grey-mid)" }}>Service</dt>
            <dd>{String(selected.service_type || "—")}</dd>
            <dt style={{ color: "var(--grey-mid)" }}>Client</dt>
            <dd>{String(selected.client_name || "—")}</dd>
            <dt style={{ color: "var(--grey-mid)" }}>Email</dt>
            <dd style={{ wordBreak: "break-all" }}>{String(selected.email || "—")}</dd>
            <dt style={{ color: "var(--grey-mid)" }}>Phone</dt>
            <dd>{String(selected.phone || "—")}</dd>
            <dt style={{ color: "var(--grey-mid)" }}>Date</dt>
            <dd>{selected.starts_at ? new Date(String(selected.starts_at)).toLocaleString() : "—"}</dd>
            <dt style={{ color: "var(--grey-mid)" }}>Status</dt>
            <dd>
              <span style={{
                display: "inline-block",
                padding: "0.1rem 0.5rem",
                borderRadius: 4,
                fontSize: "0.75rem",
                background: STATUS_COLORS[String(selected.status)] ?? "#e5e7eb",
                color: "#fff",
              }}>
                {String(selected.status || "—")}
              </span>
            </dd>
            {selected.notes ? <><dt style={{ color: "var(--grey-mid)" }}>Notes</dt><dd>{String(selected.notes)}</dd></> : null}
            {selected.internal_notes ? <><dt style={{ color: "var(--grey-mid)" }}>Internal</dt><dd>{String(selected.internal_notes)}</dd></> : null}
          </dl>
          <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {["confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                className="btn btn-sm btn-outline"
                style={{ fontSize: "0.78rem" }}
                onClick={() => updateStatus(s)}
                disabled={selected.status === s}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
