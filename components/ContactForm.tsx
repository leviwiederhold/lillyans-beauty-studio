"use client";

import { useState } from "react";
import { ADDRESS, EMAIL, MAPS_URL, PHONE, PHONE_TEL } from "@/lib/constants";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setStatus("loading");
    setMessage("");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(typeof data.error === "string" ? data.error : "Please check the form and try again.");
      return;
    }
    setStatus("success");
    setMessage(data.deposit_required === false ? "Message sent. Your code was accepted, so no deposit is required." : "Message sent. Lilly will respond personally.");
  }

  return (
    <div className="contact-strip" id="contact">
      <div className="contact-inner">
        <div>
          <h3>Get in Touch</h3>
          <p className="contact-info-text">Inquire about wedding availability, permanent makeup, memberships, or any of our services. Lilly responds personally to every message.</p>
          <div className="contact-detail"><span className="contact-dot">✦</span><a href={`tel:${PHONE_TEL}`}>{PHONE}</a></div>
          <div className="contact-detail"><span className="contact-dot">✦</span><a href={`mailto:${EMAIL}`}>{EMAIL}</a></div>
          <div className="contact-detail"><span className="contact-dot">✦</span><a href={MAPS_URL} target="_blank">{ADDRESS}</a></div>
        </div>
        <form action={submit}>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="cf-group"><label className="sr-only" htmlFor="contact-name">Your name</label><input id="contact-name" name="name" type="text" placeholder="Your name" autoComplete="name" required /></div>
          <div className="cf-group"><label className="sr-only" htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" placeholder="Email address" autoComplete="email" required /></div>
          <div className="cf-group"><label className="sr-only" htmlFor="contact-phone">Phone number</label><input id="contact-phone" name="phone" type="tel" placeholder="Phone number (optional)" autoComplete="tel" /></div>
          <div className="cf-group">
            <label className="sr-only" htmlFor="contact-subject">What are you inquiring about?</label>
            <select id="contact-subject" name="subject" required>
              <option value="">I&apos;m inquiring about...</option>
              <option>Wedding Makeup</option><option>Bridal Trial</option><option>Permanent Makeup</option><option>Facials</option><option>Waxing</option><option>Brow or Lash Lift</option><option>Gift Card</option><option>Membership</option><option>Other</option>
            </select>
          </div>
          <div className="cf-group"><label className="sr-only" htmlFor="contact-code">Gift card or no-deposit code</label><input id="contact-code" name="code" type="text" placeholder="Gift card or no-deposit code (optional)" autoComplete="off" /></div>
          <div className="cf-group"><label className="sr-only" htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" placeholder="Tell me about your event or what you're looking for..." required /></div>
          {message && <p className={`form-status ${status}`}>{message}</p>}
          <button className="btn-primary" disabled={status === "loading"} style={{ width: "100%" }}>{status === "loading" ? "Sending..." : status === "success" ? "Message Sent ✓" : "Send Message"}</button>
        </form>
      </div>
    </div>
  );
}
