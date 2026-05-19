"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Holiday", "Just Because", "Other"];
const AMOUNTS = [
  { label: "$25", cents: 2500 },
  { label: "$50", cents: 5000 },
  { label: "$75", cents: 7500 },
  { label: "$100", cents: 10000 },
  { label: "$150", cents: 15000 },
];

export function GiftCardForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"buy" | "inquiry">("buy");
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  // Buy online state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [forSelf, setForSelf] = useState(false);

  async function buyOnline() {
    if (!selectedAmount) { setMsg("Please select an amount."); return; }
    setStatus("loading"); setMsg("");
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push("/login?next=/gift-cards"); return; }

    const res = await fetch("/api/gift-card/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount_cents: selectedAmount,
        recipient_email: forSelf ? data.user.email : recipientEmail.trim() || data.user.email,
        recipient_name: forSelf ? "" : recipientName.trim(),
      }),
    });
    const json = await res.json();
    setStatus("idle");
    if (!res.ok) { setMsg(json.error || "Could not start checkout."); return; }
    if (json.url) window.location.assign(json.url);
  }

  async function submitInquiry(fd: FormData) {
    setStatus("loading"); setMsg("");
    const payload = {
      name: `${fd.get("first_name")} ${fd.get("last_name")}`.trim(),
      email: fd.get("email"),
      phone: fd.get("phone"),
      occasion: fd.get("occasion"),
      occasion_detail: fd.get("occasion_detail"),
      message: fd.get("message"),
    };
    try {
      const res = await fetch("/api/gift-card-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setMsg(data.error || "Could not submit. Please try again."); return; }
      setStatus("success");
    } catch {
      setStatus("error"); setMsg("An error occurred. Please try again.");
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
    <div className="card" style={{ maxWidth: 580, margin: "0 auto" }}>
      <div className="card-header" style={{ background: "var(--black)" }}>
        <span className="card-title" style={{ color: "#fff", fontSize: "1rem" }}>Gift Cards</span>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {(["buy", "inquiry"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setMsg(""); }}
            style={{
              flex: 1, padding: "0.7rem", border: "none", background: tab === t ? "#fff" : "var(--pink-light)",
              fontFamily: "inherit", fontSize: "0.82rem", fontWeight: tab === t ? 600 : 400,
              cursor: "pointer", borderBottom: tab === t ? "2px solid var(--pink-dark)" : "none",
              color: tab === t ? "var(--pink-dark)" : "var(--grey-mid)",
            }}
          >
            {t === "buy" ? "Buy Online" : "Custom / Inquiry"}
          </button>
        ))}
      </div>

      <div className="card-body">
        {tab === "buy" && (
          <>
            <p style={{ fontSize: "0.82rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
              Select a denomination and pay securely through Square. The recipient receives their code by email immediately.
            </p>

            {/* Amount selector */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {AMOUNTS.map((a) => (
                <button
                  key={a.cents}
                  onClick={() => setSelectedAmount(a.cents)}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: 8, border: `1.5px solid ${selectedAmount === a.cents ? "var(--pink-dark)" : "var(--border)"}`,
                    background: selectedAmount === a.cents ? "var(--pink-light)" : "#fff",
                    fontFamily: "inherit", fontSize: "0.88rem", fontWeight: selectedAmount === a.cents ? 600 : 400,
                    cursor: "pointer", color: "var(--black)",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
              <input type="checkbox" checked={forSelf} onChange={(e) => setForSelf(e.target.checked)} style={{ width: "auto" }} />
              This is for me
            </label>

            {!forSelf && (
              <>
                <div className="field-group">
                  <label className="field-label">Recipient Name</label>
                  <input className="field-input" placeholder="Jane Smith" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Recipient Email</label>
                  <input className="field-input" type="email" placeholder="jane@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                </div>
              </>
            )}

            {msg && <p style={{ fontSize: "0.78rem", color: "#9b1c31", marginBottom: "0.8rem" }}>{msg}</p>}
            <button
              className="btn btn-pink btn-full"
              onClick={buyOnline}
              disabled={status === "loading" || !selectedAmount}
            >
              {status === "loading" ? "Please wait…" : `Buy ${AMOUNTS.find((a) => a.cents === selectedAmount)?.label ?? ""} Gift Card`}
            </button>
            <p style={{ fontSize: "0.72rem", color: "var(--grey-light)", marginTop: "0.6rem" }}>
              You&apos;ll be taken to a secure Square checkout page. A sign-in is required.
            </p>
          </>
        )}

        {tab === "inquiry" && (
          <form action={submitInquiry}>
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
        )}
      </div>
    </div>
  );
}
