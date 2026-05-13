"use client";

import { useState } from "react";

const occasions = ["Birthday", "Anniversary", "Wedding", "Mother's Day", "Graduation", "Holiday", "Thank You", "Self Care", "Other"];

export function GiftCardInquiryForm() {
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setStatus("loading");
    setMessage("Sending inquiry...");
    const response = await fetch("/api/gift-card-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(typeof data.error === "string" ? data.error : "Please check the required fields and try again.");
      return;
    }

    setStatus(data.warning ? "error" : "success");
    setMessage(data.warning || "Gift card inquiry sent. Lilly will follow up personally.");
  }

  return (
    <form className="gift-card-form" action={submit}>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" />
      <div className="form-row">
        <label>Purchaser name<input name="purchaser_name" placeholder="Your name" required /></label>
        <label>Purchaser email<input name="purchaser_email" type="email" placeholder="you@example.com" required /></label>
      </div>
      <div className="form-row">
        <label>Purchaser phone<input name="purchaser_phone" type="tel" placeholder="(513) 000-0000" required /></label>
        <label>Recipient name<input name="recipient_name" placeholder="Recipient name" required /></label>
      </div>
      <div className="form-row">
        <label>Gift card amount requested<input name="amount_requested" placeholder="$100" required /></label>
        <label>Preferred contact method<select name="preferred_contact_method" required><option value="">Select</option><option>Email</option><option>Phone</option><option>Text</option></select></label>
      </div>
      <label>Occasion<select name="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} required><option value="">Select occasion</option>{occasions.map((item) => <option key={item}>{item}</option>)}</select></label>
      {occasion === "Other" && <label>Please describe the occasion<input name="occasion_other" placeholder="Tell Lilly what the gift is for" required /></label>}
      <label>Message/note<textarea name="message" placeholder="Add a message, timing note, or question..." /></label>
      {message && <p className={`form-status ${status}`}>{message}</p>}
      <button className="btn-primary full-btn" disabled={status === "loading"}>{status === "loading" ? "Sending..." : "Send Gift Card Inquiry"}</button>
    </form>
  );
}
