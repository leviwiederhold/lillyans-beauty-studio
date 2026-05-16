"use client";

import { useState } from "react";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Holiday", "Just Because", "Other"];

export function GiftCardForm() {
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(fd: FormData) {
    setStatus("loading");
    setMsg("");
    const payload = {
      name: `${fd.get("first_name")} ${fd.get("last_name")}`.trim(),
      email: fd.get("email"),
      phone: fd.get("phone"),
      occasion: fd.get("occasion"),
      occasion_detail: fd.get("occasion_detail"),
      message: fd.get("message")
    };
    try {
      const res = await fetch("/api/gift-card-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setMsg(data.error || "Could not submit. Please try again."); return; }
      setStatus("success");
    } catch {
      setStatus("error");
      setMsg("An error occurred. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="card-body">
          <div className="intake-status complete" style={{ marginBottom: "1rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Your gift card inquiry has been sent!
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)" }}>Lilly will reach out to arrange your gift card. Thank you!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card-header" style={{ background: "var(--black)" }}>
        <span className="card-title" style={{ color: "#fff", fontSize: "1rem" }}>Gift Card Inquiry</span>
      </div>
      <div className="card-body">
        <form action={submit}>
          <div className="g2" style={{ gap: "0.8rem" }}>
            <div className="field-group">
              <label className="field-label">First Name</label>
              <input className="field-input" name="first_name" required placeholder="Jane" />
            </div>
            <div className="field-group">
              <label className="field-label">Last Name</label>
              <input className="field-input" name="last_name" placeholder="Smith" />
            </div>
          </div>
          <div className="g2" style={{ gap: "0.8rem" }}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field-group">
              <label className="field-label">Phone (optional)</label>
              <input className="field-input" name="phone" type="tel" placeholder="(513) 555-0100" />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Occasion</label>
            <select className="field-input" name="occasion" required value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              <option value="">Select an occasion…</option>
              {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {occasion === "Other" && (
            <div className="field-group">
              <label className="field-label">Please describe the occasion</label>
              <textarea className="field-input" name="occasion_detail" rows={2} placeholder="Tell us more…" />
            </div>
          )}
          <div className="field-group">
            <label className="field-label">Message / Special Requests (optional)</label>
            <textarea className="field-input" name="message" rows={3} placeholder="Any notes for Lilly about the gift card…" />
          </div>
          {msg && <p style={{ fontSize: "0.78rem", color: "#9b1c31", marginBottom: "0.8rem" }}>{msg}</p>}
          <button className="btn btn-pink btn-full" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Send Gift Card Inquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
