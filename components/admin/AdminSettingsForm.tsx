"use client";

import { useState } from "react";

export function AdminSettingsForm({ settings }: { settings: any }) {
  const [message, setMessage] = useState("");

  async function save(fd: FormData) {
    setMessage("Saving...");
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Settings saved." : body.error || "Settings could not be saved.");
  }

  const year = new Date().getFullYear();

  return (
    <form action={save}>
      {message && <p className="admin-message">{message}</p>}
      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Business Information</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Studio name</label><input className="f-input" value="Lillyan's Beauty Studio" readOnly /></div>
              <div className="f-row"><label className="f-label">Location wording</label><input className="f-input" name="service_availability" defaultValue={settings?.service_availability || "Cincinnati, Ohio · Serving Cincinnati, Ohio"} /></div>
              <div className="f-row"><label className="f-label">Phone number</label><input className="f-input" value="513-687-4317" type="tel" readOnly /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Contact email</label><input className="f-input" value="lillyansbeautystudio@gmail.com" type="email" readOnly /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Social Links</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Instagram</label><input className="f-input" value="@lillyans_beautystudio" readOnly /></div>
              <div className="f-row"><label className="f-label">Facebook</label><input className="f-input" placeholder="Facebook page URL" /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">TikTok</label><input className="f-input" placeholder="TikTok handle" /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Policies</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Booking policy</label><textarea className="f-input f-textarea" name="business_hours" defaultValue={settings?.business_hours || "All appointments require a 20% deposit through Square unless a valid gift card/no-deposit code waives the deposit."} /></div>
              <div className="f-row"><label className="f-label">Cancellation policy</label><textarea className="f-input f-textarea" name="deposit_amounts" defaultValue={JSON.stringify(settings?.deposit_amounts || { default_percent: 20 }, null, 2)} /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Wedding travel note</label><textarea className="f-input f-textarea" name="travel_wedding_availability" style={{ minHeight: 56 }} defaultValue={settings?.travel_wedding_availability || "Available for weddings in Cincinnati, Ohio and beyond. Travel within the United States may be available when travel expenses are covered."} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Footer Text</span></div>
            <div className="card-body">
              <div className="f-row" style={{ marginBottom: 0 }}><textarea className="f-input f-textarea" defaultValue={`© ${year} Lillyan's Beauty Studio · Cincinnati, Ohio · All rights reserved`} /></div>
            </div>
          </div>
          <input type="hidden" name="blocked_dates" defaultValue={JSON.stringify(settings?.blocked_dates || [])} />
          <input type="hidden" name="service_durations" defaultValue={JSON.stringify(settings?.service_durations || {})} />
          <input type="hidden" name="gift_card_auto_confirm" value={settings?.gift_card_auto_confirm ? "true" : "false"} />
          <input type="hidden" name="booking_url" value={settings?.booking_url || ""} />
          <input type="hidden" name="gift_card_url" value={settings?.gift_card_url || ""} />
          <button className="btn btn-primary">Save all settings</button>
        </div>
      </div>
    </form>
  );
}
