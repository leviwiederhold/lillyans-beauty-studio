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
    <div className="two-col">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-hdr"><span className="card-hdr-title">Upcoming Calendar</span></div>
        <div className="card-body">
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
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {selected ? (
        <div className="card" style={{ position: "sticky", top: "1rem" }}>
          <div className="card-hdr">
            <span className="card-hdr-title">Booking Detail</span>
            <button
              onClick={() => setSelected(null)}
              className="modal-close"
              aria-label="Close"
            ><i className="ti ti-x" /></button>
          </div>
          <div className="card-body">
            <div className="form-q"><div className="form-q-label">Service</div><div className="form-q-val">{String(selected.service_type || "—")}</div></div>
            <div className="form-q"><div className="form-q-label">Client</div><div className="form-q-val">{String(selected.client_name || "—")} · {String(selected.email || "—")} · {String(selected.phone || "—")}</div></div>
            <div className="form-q"><div className="form-q-label">Date & Time</div><div className="form-q-val">{selected.starts_at ? new Date(String(selected.starts_at)).toLocaleString() : "—"}</div></div>
            <div className="form-q"><div className="form-q-label">Status</div><div className="form-q-val">{String(selected.status || "—").replaceAll("_", " ")}</div></div>
            {selected.notes ? <div className="form-q"><div className="form-q-label">Notes</div><div className="form-q-val">{String(selected.notes)}</div></div> : null}
            {selected.internal_notes ? <div className="form-q"><div className="form-q-label">Internal</div><div className="form-q-val">{String(selected.internal_notes)}</div></div> : null}
          <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {["confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                className="btn btn-secondary"
                onClick={() => updateStatus(s)}
                disabled={selected.status === s}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          </div>
        </div>
        ) : (
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Upcoming Appointments</span></div>
            <div className="card-body">
              {bookings.slice(0, 5).map((booking) => (
                <div className="appt-row" key={String(booking.id)}>
                  <div className="appt-time">{booking.starts_at ? new Date(String(booking.starts_at)).toLocaleDateString("en-US", { weekday: "short" }) : "TBD"}</div>
                  <div className={`appt-dot ${booking.status === "confirmed" ? "confirmed" : "pending"}`} />
                  <div className="appt-info"><div className="appt-name">{String(booking.client_name || "Client")}</div><div className="appt-svc">{String(booking.service_type || "Appointment")}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
