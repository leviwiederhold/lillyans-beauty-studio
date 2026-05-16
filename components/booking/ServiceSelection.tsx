"use client";

import { useState } from "react";

const SERVICES = {
  pmu: {
    label: "Permanent Makeup",
    count: 14,
    icon: "✦",
    groups: [
      {
        items: [
          { name: "Microblading", duration: "2 hr", price: "$425" },
          { name: "Powder Brows", duration: "2 hr", price: "$425" },
          { name: "Combination Brows", duration: "2 hr 30 min", price: "$450" },
          { name: "Lip Blush", duration: "3 hr", price: "$450" },
          { name: "Dark Lip Neutralization", duration: "3 hr", price: "$550" },
          { name: "Brows & Lips Bundle", duration: "5 hr", price: "$800" },
        ],
      },
      {
        subLabel: "Touch-Ups & Color Boosts",
        items: [
          { name: "Microblading Touch-Up", note: "within 6 wks", duration: "2 hr", price: "$50" },
          { name: "Microblading Color Boost", note: "yearly", duration: "2 hr", price: "$150" },
          { name: "Powder Brow Touch-Up", note: "within 8 wks", duration: "2 hr", price: "$50" },
          { name: "Powder Brow Color Boost", note: "yearly", duration: "2 hr", price: "$150" },
          { name: "Combo Brow Touch-Up", note: "within 8 wks", duration: "2 hr", price: "$50" },
          { name: "Combo Brow Color Boost", note: "yearly", duration: "2 hr", price: "$150" },
          { name: "Lip Blush Touch-Up", note: "within 8 wks", duration: "2 hr 30 min", price: "$50" },
          { name: "Lip Blush Color Boost", note: "yearly", duration: "2 hr 30 min", price: "$150" },
        ],
      },
    ],
  },
  facial: {
    label: "Facials",
    count: 20,
    icon: "◈",
    groups: [
      {
        items: [
          { name: "First Facial Visit", duration: "1 hr", price: "$55" },
          { name: "Signature Spa Facial", duration: "1 hr", price: "$65" },
          { name: "Signature Back Facial", duration: "1 hr", price: "$85" },
          { name: "Customized Facial", duration: "1 hr", price: "$75" },
          { name: "Ageless Facial", duration: "1 hr", price: "$85" },
          { name: "Acne Facial", duration: "1 hr", price: "$75" },
          { name: "Acne Back Facial", duration: "1 hr", price: "$95" },
          { name: "LED Facial", duration: "1 hr", price: "$85" },
          { name: "LED Back Facial", duration: "1 hr", price: "$105" },
          { name: "Dermaplane Facial", duration: "1 hr 15 min", price: "$85" },
          { name: "Solo Dermaplane", duration: "30 min", price: "$55" },
          { name: "Solo Chemical Peel", duration: "45 min", price: "$65" },
        ],
      },
      {
        subLabel: "Add-Ons",
        items: [
          { name: "LED", addon: true, duration: "20 min", price: "$15" },
          { name: "Dermaplaning", addon: true, duration: "30 min", price: "$20" },
          { name: "Chemical Peel", addon: true, duration: "30 min", price: "$25" },
          { name: "Microdermabrasion", addon: true, duration: "15 min", price: "$20" },
          { name: "High Frequency", addon: true, duration: "15 min", price: "$12" },
          { name: "Microcurrent", addon: true, duration: "15 min", price: "$12" },
          { name: "Jelly Mask", addon: true, duration: "15 min", price: "$12" },
          { name: "Gua Sha", addon: true, duration: "15 min", price: "$8" },
        ],
      },
    ],
  },
  wax: {
    label: "Waxing",
    count: 12,
    icon: "◇",
    groups: [
      {
        items: [
          { name: "Eyebrow Wax", duration: "15 min", price: "$15" },
          { name: "Chin Wax", duration: "15 min", price: "$15" },
          { name: "Lip Wax", duration: "15 min", price: "$15" },
          { name: "Cheek Wax", duration: "15 min", price: "$15" },
          { name: "Full Face Wax", duration: "30 min", price: "$60" },
          { name: "Underarm Wax", duration: "15 min", price: "$20" },
          { name: "Half Arm Wax", duration: "30 min", price: "$25" },
          { name: "Full Arm Wax", duration: "30 min", price: "$35" },
          { name: "Half Leg Wax", duration: "45 min", price: "$35" },
          { name: "Full Leg Wax", duration: "1 hr", price: "$70" },
          { name: "Bikini Line Wax", duration: "30 min", price: "$30" },
          { name: "V Brazilian Wax", duration: "30 min", price: "$60" },
        ],
      },
    ],
  },
  makeup: {
    label: "Formal Makeup",
    count: 1,
    icon: "◉",
    groups: [
      {
        items: [
          { name: "Formal Makeup", duration: "1 hr", price: "$70+" },
        ],
      },
    ],
  },
  lifts: {
    label: "Lifts & Tints",
    count: 9,
    icon: "◌",
    groups: [
      {
        items: [
          { name: "Lash Lift & Tint", duration: "1 hr", price: "$75" },
          { name: "Lash Lift", duration: "45 min", price: "$60" },
          { name: "Brow Tint + Lami", duration: "1 hr", price: "$75" },
          { name: "Brow Tint, Lami & Wax", duration: "1 hr", price: "$85" },
          { name: "Brow & Lash Bundle", duration: "1 hr 30 min", price: "$135" },
          { name: "Brow Lamination", duration: "30 min", price: "$60" },
          { name: "Brow Lamination + Wax", duration: "30 min", price: "$70" },
          { name: "Brow Tint", duration: "30 min", price: "$25" },
          { name: "Brow Tint & Wax", duration: "45 min", price: "$35" },
        ],
      },
    ],
  },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  pmu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  ),
  facial: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  wax: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 6-8 8-8 14a8 8 0 0 0 16 0c0-6-8-8-8-14z"/>
    </svg>
  ),
  makeup: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  lifts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

type SelectedService = {
  name: string;
  price: string;
  duration: string;
  category: string;
  note?: string;
  addon?: boolean;
};

export default function ServiceSelection({ onNext }: { onNext: (service: SelectedService) => void }) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);

  function handleCatClick(catKey: string) {
    setSelectedCat(catKey);
    setSelectedService(null);
  }

  function handleServiceClick(service: { name: string; price: string; duration: string; note?: string; addon?: boolean }, catKey: string) {
    if (selectedService?.name === service.name) {
      setSelectedService(null);
    } else {
      setSelectedService({ ...service, category: SERVICES[catKey as keyof typeof SERVICES].label });
    }
  }

  function handleNext() {
    if (selectedService) {
      onNext(selectedService);
    }
  }

  const cat = selectedCat ? SERVICES[selectedCat as keyof typeof SERVICES] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#faf8f6", fontFamily: "'DM Sans', sans-serif", color: "#2c2220", position: "relative", paddingBottom: selectedService ? 100 : 32 }}>

      {/* Heading */}
      <div style={{ padding: "24px 20px 8px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b85c72", marginBottom: 6 }}>Step 1 of 5</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, lineHeight: 1.2, color: "#2c2220" }}>
          What are you<br />coming in <em>for?</em>
        </div>
        <div style={{ fontSize: 13, color: "#a08080", marginTop: 6 }}>Choose a category to see available services</div>
      </div>

      {/* Category grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 20px 4px" }}>
        {Object.entries(SERVICES).map(([key, data]) => {
          const active = selectedCat === key;
          return (
            <div
              key={key}
              onClick={() => handleCatClick(key)}
              style={{
                background: active ? "#fdf5f7" : "#fff",
                border: `1.5px solid ${active ? "#b85c72" : "#f0e8e4"}`,
                borderRadius: 14,
                padding: "14px 14px 12px",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: active ? "#b85c72" : "#f7eff2",
                color: active ? "#fff" : "#b85c72",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                {CATEGORY_ICONS[key]}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#2c2220", lineHeight: 1.3 }}>{data.label}</div>
              <div style={{ fontSize: 11, color: "#a08080", marginTop: 3 }}>{data.count} service{data.count !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      {/* Service list */}
      {cat && (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ borderTop: "1px solid #f0e8e4", paddingTop: 16, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#b85c72" }}>{cat.label}</span>
            <span style={{ fontSize: 11, color: "#a08080" }}>{cat.count} services</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {cat.groups.map((group, gi) => (
              <div key={gi}>
                {(group as { subLabel?: string }).subLabel && (
                  <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c09898", padding: "6px 0 8px" }}>
                    {(group as { subLabel?: string }).subLabel}
                  </div>
                )}
                {group.items.map((svc) => {
                  const sel = selectedService?.name === svc.name;
                  return (
                    <div
                      key={svc.name}
                      onClick={() => handleServiceClick(svc, selectedCat!)}
                      style={{
                        background: sel ? "#fdf5f7" : (svc as { addon?: boolean }).addon ? "#fdfaf9" : "#fff",
                        border: `1px ${(svc as { addon?: boolean }).addon ? "dashed" : "solid"} ${sel ? "#b85c72" : "#f0e8e4"}`,
                        borderRadius: 12,
                        padding: "13px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                        marginBottom: 2,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {(svc as { addon?: boolean }).addon && (
                          <span style={{ display: "inline-block", fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase", background: "#f7eff2", color: "#b85c72", borderRadius: 4, padding: "2px 5px", marginRight: 6 }}>
                            add-on
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#2c2220" }}>{svc.name}</span>
                        {(svc as { note?: string }).note && <span style={{ fontSize: 11, color: "#a08080", marginLeft: 6 }}>· {(svc as { note?: string }).note}</span>}
                        <div style={{ fontSize: 11, color: "#a08080", marginTop: 3 }}>{svc.duration}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12, flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#b85c72", lineHeight: 1 }}>{svc.price}</span>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          border: `1.5px solid ${sel ? "#b85c72" : "#e0d4d0"}`,
                          background: sel ? "#b85c72" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 12, flexShrink: 0,
                          transition: "all 0.15s",
                        }}>
                          {sel && "✓"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      {selectedService && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid #f0e8e4",
          padding: "14px 20px 28px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
          zIndex: 50,
        }}>
          <div style={{ fontSize: 11, color: "#a08080", marginBottom: 2 }}>Selected service</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#2c2220", marginBottom: 12 }}>
            {selectedService.name} — {selectedService.price} · {selectedService.duration}
          </div>
          <button
            onClick={handleNext}
            style={{
              width: "100%", padding: "15px", background: "#b85c72",
              color: "#fff", border: "none", borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
          >
            Next: pick a date & time →
          </button>
        </div>
      )}
    </div>
  );
}
