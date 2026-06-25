"use client";

import { useState } from "react";

type Settings = Record<string, string | null | undefined>;

// Website settings editor in the AdminUI style, wired to /api/admin/website-settings.
export function SettingsForm({ settings }: { settings: Settings }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const year = new Date().getFullYear();
  const v = (k: string, fallback = "") => settings[k] ?? fallback;

  async function save(fd: FormData) {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/website-settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setSaving(false);
    setMsg(res.ok ? "All settings saved." : "Could not save settings.");
  }

  return (
    <form action={save}>
      <div className="two-col">
        <div className="col-stack">
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Business Information</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Studio name</label><input className="f-input" name="business_name" defaultValue={v("business_name", "Lillyan's Beauty Studio")} /></div>
              <div className="f-row"><label className="f-label">Service area</label><input className="f-input" name="service_area" defaultValue={v("service_area", "Cincinnati, Ohio")} /></div>
              <div className="f-row"><label className="f-label">Phone number</label><input className="f-input" name="contact_phone" type="tel" defaultValue={v("contact_phone")} /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Contact email</label><input className="f-input" name="contact_email" type="email" defaultValue={v("contact_email", "lillyansbeautystudio@gmail.com")} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Social Links</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Instagram</label><input className="f-input" name="instagram_url" defaultValue={v("instagram_url", "@lillyans_beautystudio")} /></div>
              <div className="f-row"><label className="f-label">Facebook</label><input className="f-input" name="facebook_url" defaultValue={v("facebook_url")} placeholder="Facebook page URL" /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">TikTok</label><input className="f-input" name="tiktok_url" defaultValue={v("tiktok_url")} placeholder="TikTok handle" /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Policies</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Booking policy</label><textarea className="f-input f-textarea" name="booking_policy" defaultValue={v("booking_policy")} /></div>
              <div className="f-row"><label className="f-label">Cancellation policy</label><textarea className="f-input f-textarea" name="cancellation_policy" defaultValue={v("cancellation_policy")} /></div>
              <div className="f-row"><label className="f-label">Deposit policy</label><textarea className="f-input f-textarea" name="deposit_policy" defaultValue={v("deposit_policy")} /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Wedding travel policy</label><textarea className="f-input f-textarea" name="wedding_travel_policy" style={{ minHeight: 56 }} defaultValue={v("wedding_travel_policy", "Available for weddings throughout the United States when travel expenses are covered.")} /></div>
            </div>
          </div>
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Footer Text</span></div>
            <div className="card-body">
              <div className="f-row" style={{ marginBottom: 0 }}>
                <textarea className="f-input f-textarea" name="footer_text" defaultValue={v("footer_text", `© ${year} Lillyan's Beauty Studio · Cincinnati, Ohio · All rights reserved.`)} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save all settings"}</button>
            {msg && <span style={{ fontSize: 12, color: "var(--ink3)" }}>{msg}</span>}
          </div>
        </div>
      </div>
    </form>
  );
}
