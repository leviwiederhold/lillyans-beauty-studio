"use client";

import Link from "next/link";
import { useState } from "react";

type Service = { name: string; price: string; duration?: string; note?: string };
type AddOn = { name: string; price: string };
type Category = { id: string; label: string; services: Service[]; addOns?: AddOn[] };

const CATEGORIES: Category[] = [
  {
    id: "pmu",
    label: "Permanent Makeup",
    services: [
      { name: "Microblading", price: "$425", duration: "2 hr" },
      { name: "Powder / Ombré Brows", price: "$425", duration: "2 hr" },
      { name: "Combination Brows", price: "$450", duration: "2.5 hr" },
      { name: "Lip Blush", price: "$450", duration: "3 hr" },
      { name: "Dark Lip Neutralization", price: "$550", duration: "3 hr" },
      { name: "Brows & Lips Bundle", price: "$800", duration: "5 hr" },
      { name: "Microblading Touch-Up (same artist)", price: "$150", duration: "1.5 hr", note: "Within 18 mo" },
      { name: "Microblading Touch-Up (new client)", price: "$150", duration: "1.5 hr", note: "New client / other artist" },
      { name: "Powder Brow Touch-Up (same artist)", price: "$125", duration: "1.5 hr", note: "Within 18 mo" },
      { name: "Powder Brow Touch-Up (new client)", price: "$150", duration: "1.5 hr", note: "New client / other artist" },
      { name: "Combination Brow Touch-Up (same artist)", price: "$150", duration: "1.5 hr", note: "Within 18 mo" },
      { name: "Combination Brow Touch-Up (new client)", price: "$175", duration: "1.5 hr", note: "New client / other artist" },
      { name: "Lip Blush Touch-Up (same artist)", price: "$150", duration: "2 hr", note: "Within 18 mo" },
      { name: "Lip Blush Touch-Up (new client)", price: "$175", duration: "2 hr", note: "New client / other artist" },
      { name: "PMU Color Boost", price: "$50", duration: "30 min", note: "Minor refresh, same artist within 12 mo" }
    ]
  },
  {
    id: "facials",
    label: "Facials",
    services: [
      { name: "First Facial Visit", price: "$55", duration: "45 min", note: "New clients" },
      { name: "Signature Spa Facial", price: "$65", duration: "50 min" },
      { name: "Signature Back Facial", price: "$85", duration: "50 min" },
      { name: "Customized Facial", price: "$75", duration: "60 min" },
      { name: "Ageless Facial", price: "$85", duration: "60 min" },
      { name: "Acne Facial", price: "$75", duration: "60 min" },
      { name: "Acne Back Facial", price: "$95", duration: "60 min" },
      { name: "LED Facial", price: "$85", duration: "60 min" },
      { name: "LED Back Facial", price: "$105", duration: "60 min" },
      { name: "Dermaplane Facial", price: "$85", duration: "60 min" },
      { name: "Solo Dermaplane", price: "$55", duration: "30 min" },
      { name: "Solo Chemical Peel", price: "$65", duration: "30 min" }
    ],
    addOns: [
      { name: "LED Light Therapy", price: "+$15" },
      { name: "Dermaplaning", price: "+$20" },
      { name: "Chemical Peel", price: "+$25" },
      { name: "Microdermabrasion", price: "+$20" },
      { name: "High Frequency", price: "+$12" },
      { name: "Microcurrent", price: "+$12" },
      { name: "Jelly Mask", price: "+$12" },
      { name: "Gua Sha", price: "+$8" }
    ]
  },
  {
    id: "waxing",
    label: "Waxing",
    services: [
      { name: "Eyebrow Wax", price: "$15" },
      { name: "Chin Wax", price: "$15" },
      { name: "Lip Wax", price: "$15" },
      { name: "Cheek Wax", price: "$15" },
      { name: "Full Face Wax", price: "$60" },
      { name: "Half Arm Wax", price: "$25" },
      { name: "Full Arm Wax", price: "$35" },
      { name: "Half Leg Wax", price: "$35" },
      { name: "Full Leg Wax", price: "$70" },
      { name: "Underarm Wax", price: "$20" },
      { name: "Bikini Line Wax", price: "$30" },
      { name: "V Brazilian Wax", price: "$60" }
    ]
  },
  {
    id: "lifts",
    label: "Lifts + Tints",
    services: [
      { name: "Brow & Lash Bundle", price: "$135", duration: "75 min" },
      { name: "Lash Lift & Tint", price: "$75", duration: "45 min" },
      { name: "Lash Lift", price: "$60", duration: "45 min" },
      { name: "Brow Tint + Lamination", price: "$75", duration: "45 min" },
      { name: "Brow Tint, Lami & Wax", price: "$85", duration: "50 min" },
      { name: "Brow Tint", price: "$25", duration: "15 min" },
      { name: "Brow Tint & Wax", price: "$35", duration: "25 min" },
      { name: "Brow Lamination", price: "$60", duration: "45 min" },
      { name: "Brow Lamination + Wax", price: "$70", duration: "50 min" }
    ]
  },
  {
    id: "formal",
    label: "Formal Makeup",
    services: [
      { name: "Formal Makeup", price: "$70+", duration: "60 min", note: "Contact for group / event pricing" }
    ]
  }
];

export function ServicesGrid() {
  const [active, setActive] = useState("pmu");
  const cat = CATEGORIES.find((c) => c.id === active)!;

  return (
    <>
      <div className="svc-category-tabs">
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`svc-tab${active === c.id ? " active" : ""}`} onClick={() => setActive(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="svc-grid">
        {cat.services.map((s) => (
          <div key={s.name} className="svc-card">
            <div className="svc-card-name">{s.name}</div>
            {(s.duration || s.note) && (
              <div className="svc-card-meta">
                {s.duration && <span>{s.duration}</span>}
                {s.duration && s.note && <span> · </span>}
                {s.note && <span>{s.note}</span>}
              </div>
            )}
            <div className="svc-card-footer">
              <div className="svc-card-price">{s.price}</div>
              <a href="/book" className="svc-card-book">Book</a>
            </div>
          </div>
        ))}
      </div>

      {cat.addOns && cat.addOns.length > 0 && (
        <div className="svc-add-ons">
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--pink-dark)", fontWeight: 500, marginBottom: "0.6rem" }}>
            Available Add-Ons
          </p>
          {cat.addOns.map((a) => (
            <div key={a.name} className="svc-add-on-row">
              <span>{a.name}</span>
              <span style={{ fontWeight: 500, color: "var(--pink-dark)" }}>{a.price}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "2rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
        <Link href="/book" className="btn btn-pink">Book an Appointment</Link>
        <Link href="/#contact" className="btn btn-ghost">Contact the Studio</Link>
      </div>
    </>
  );
}
