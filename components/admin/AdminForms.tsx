"use client";

import { useState } from "react";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GiftCodeManager } from "@/components/admin/GiftCodeManager";

export function AdminForms({ settings, gallery, codes, memberships }: { settings: any; gallery: any[]; codes: any[]; memberships: any[] }) {
  const [message, setMessage] = useState("");

  async function post(url: string, data: Record<string, FormDataEntryValue>) {
    setMessage("Saving...");
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const body = await res.json();
    setMessage(res.ok ? "Saved. Refresh to see latest rows." : body.error || "Save failed.");
  }

  async function saveGallery(fd: FormData) {
    const entries = Object.fromEntries(fd.entries());
    const file = fd.get("image_file");
    let imageUrl = String(entries.image_url || "");

    if (file instanceof File && file.size > 0) {
      setMessage("Uploading image...");
      const supabase = createSupabaseBrowserClient();
      const compressed = await compressImage(file);
      const path = `${String(entries.category).toLowerCase().replaceAll(" ", "-")}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("gallery").upload(path, compressed, { upsert: false, contentType: "image/jpeg" });
      if (error) {
        setMessage(error.message);
        return;
      }
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    await post("/api/admin/table", {
      table: "gallery_items",
      title: entries.title,
      category: entries.category,
      image_url: imageUrl,
      alt_text: entries.alt_text || ""
    });
  }

  return (
    <>
      {message && <p className="admin-message">{message}</p>}
      <section className="admin-card">
        <h2>Edit Business Hours</h2>
        <form action={(fd) => post("/api/admin/settings", Object.fromEntries(fd.entries()))}>
          <label>Business hours<textarea name="business_hours" defaultValue={settings?.business_hours || ""} placeholder="Add current hours here."></textarea></label>
          <label>Service availability<textarea name="service_availability" defaultValue={settings?.service_availability || ""} placeholder="Which services are currently available, paused, or limited."></textarea></label>
          <label>Blocked-off dates JSON<textarea name="blocked_dates" defaultValue={JSON.stringify(settings?.blocked_dates || [], null, 2)} placeholder={'["2026-06-01"]'}></textarea></label>
          <label>Travel wedding availability<textarea name="travel_wedding_availability" defaultValue={settings?.travel_wedding_availability || ""}></textarea></label>
          <label>Service duration settings JSON<textarea name="service_durations" defaultValue={JSON.stringify(settings?.service_durations || {}, null, 2)} placeholder={'{"Wedding Makeup":120}' }></textarea></label>
          <label>Deposit amount settings JSON<textarea name="deposit_amounts" defaultValue={JSON.stringify(settings?.deposit_amounts || {}, null, 2)} placeholder={'{"Wedding Makeup":5000}' }></textarea></label>
          <label>Auto-confirm valid gift card bookings<select name="gift_card_auto_confirm" defaultValue={settings?.gift_card_auto_confirm ? "true" : "false"}><option value="false">No</option><option value="true">Yes</option></select></label>
          <label>Minimum booking notice (hours)<input name="booking_minimum_notice_hours" type="number" min="0" max="720" defaultValue={settings?.booking_minimum_notice_hours ?? 48} placeholder="48" /></label>
          <label>Intake form expiration (months)<input name="intake_expiration_months" type="number" min="0" max="60" defaultValue={settings?.intake_expiration_months ?? 6} placeholder="6" /></label>
          <label>Booking URL<input name="booking_url" defaultValue={settings?.booking_url || ""} placeholder="https://..." /></label>
          <label>Gift Card URL<input name="gift_card_url" defaultValue={settings?.gift_card_url || ""} placeholder="https://..." /></label>
          <button className="btn-primary">Save Hours</button>
        </form>
      </section>
      <section className="admin-grid">
        <div className="admin-card">
          <h2>Bookable Services</h2>
          <form action={(fd) => post("/api/admin/table", { table: "services", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Name<input name="name" required /></label>
            <label>Description<textarea name="description"></textarea></label>
            <label>Service total cents<input name="service_total" type="number" min="0" placeholder="10000" /></label>
            <label>Duration minutes<input name="duration_minutes" type="number" defaultValue="60" required /></label>
            <label>Requires intake<select name="requires_intake"><option value="false">No</option><option value="true">Yes</option></select></label>
            <label>Intake type<select name="intake_type"><option value="">None</option><option value="permanent_makeup">Permanent Makeup</option><option value="facial">Facial</option><option value="waxing">Waxing</option><option value="wedding_inquiry">Wedding Inquiry</option></select></label>
            <label>Requires deposit<select name="requires_deposit"><option value="false">No</option><option value="true">Yes</option></select></label>
            <label>Deposit amount cents<input name="deposit_amount_cents" type="number" min="0" /></label>
            <button className="btn-primary">Save Service</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Availability Rules</h2>
          <form action={(fd) => post("/api/admin/table", { table: "availability_rules", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Day of week<select name="day_of_week"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select></label>
            <label>Start time<input name="start_time" type="time" required /></label>
            <label>End time<input name="end_time" type="time" required /></label>
            <button className="btn-primary">Add Availability</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Blocked Times</h2>
          <form action={(fd) => post("/api/admin/table", { table: "blocked_times", ...Object.fromEntries(fd.entries()) })}>
            <label>Starts<input name="starts_at" type="datetime-local" required /></label>
            <label>Ends<input name="ends_at" type="datetime-local" required /></label>
            <label>Reason<input name="reason" /></label>
            <button className="btn-primary">Block Time</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Homepage Text</h2>
          <form action={(fd) => post("/api/admin/content", { table: "cms_content", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Content key<input name="key" placeholder="hero_headline" required /></label>
            <label>Title<input name="title" /></label>
            <label>Body<textarea name="body"></textarea></label>
            <button className="btn-primary">Save Content</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Services & Pricing</h2>
          <form action={(fd) => post("/api/admin/content", { table: "service_settings", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Service name<input name="name" required /></label>
            <label>Description<textarea name="description"></textarea></label>
            <label>Price / membership description<input name="price_label" /></label>
            <label>Duration minutes<input name="duration_minutes" type="number" /></label>
            <label>Deposit amount cents<input name="deposit_amount_cents" type="number" /></label>
            <label>Required fields per service<input name="required_fields" placeholder="date_of_birth,allergies,signature" /></label>
            <label>Active<select name="is_active"><option value="true">On</option><option value="false">Off</option></select></label>
            <button className="btn-primary">Save Service</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Announcements / Seasonal Promos</h2>
          <form action={(fd) => post("/api/admin/content", { table: "announcements", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Title<input name="title" required /></label>
            <label>Body<textarea name="body"></textarea></label>
            <label>Starts<input name="starts_at" type="datetime-local" /></label>
            <label>Ends<input name="ends_at" type="datetime-local" /></label>
            <button className="btn-primary">Save Announcement</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Gallery Images</h2>
          <form action={saveGallery}>
            <label>Title<input name="title" required /></label>
            <label>Category<select name="category">{GALLERY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Upload image<input name="image_file" type="file" accept="image/*" /></label>
            <label>Image URL<input name="image_url" type="url" placeholder="Optional if uploading a file" /></label>
            <label>Alt text<input name="alt_text" /></label>
            <button className="btn-primary">Add Gallery Item</button>
          </form>
          <MiniList rows={gallery} fields={["title", "category"]} />
        </div>
        <div className="admin-card">
          <h2>Gift Card / No-Deposit Codes</h2>
          <form action={(fd) => post("/api/admin/table", { table: "gift_card_codes", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Code<input name="code" required /></label>
            <label>Description<input name="description" /></label>
            <label>Allow reuse<select name="allow_reuse"><option value="false">No</option><option value="true">Yes</option></select></label>
            <button className="btn-primary">Add Code</button>
          </form>
          <GiftCodeManager codes={codes} />
        </div>
        <div className="admin-card">
          <h2>Memberships</h2>
          <form action={(fd) => post("/api/admin/table", { table: "memberships", ...Object.fromEntries(fd.entries()), is_active: "true" })}>
            <label>Client name<input name="client_name" /></label>
            <label>Email<input name="email" type="email" /></label>
            <label>Plan name<input name="plan_name" required /></label>
            <label>Price label<input name="price_label" placeholder="Admin editable placeholder" /></label>
            <label>Status<input name="status" defaultValue="active" /></label>
            <label>Start date<input name="start_date" type="date" /></label>
            <label>Renewal date<input name="renewal_date" type="date" /></label>
            <label>Payment status<input name="payment_status" placeholder="paid, pending, past_due..." /></label>
            <label>Perks<textarea name="perks" placeholder="One perk per line"></textarea></label>
            <button className="btn-primary">Add Membership</button>
          </form>
          <MiniList rows={memberships} fields={["client_name", "plan_name", "status"]} />
        </div>
      </section>
    </>
  );
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 1800;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.82));
}

function MiniList({ rows, fields }: { rows: any[]; fields: string[] }) {
  return <div className="mini-list">{rows.map((row) => <p key={row.id}>{fields.map((f) => String(row[f] ?? "")).join(" · ")}</p>)}</div>;
}
