"use client";

import { useEffect, useState } from "react";
import { ADDRESS, BOOKING_URL, EMAIL, GIFT_CARD_URL, MAPS_URL, PHONE, PHONE_SMS, PHONE_TEL } from "@/lib/constants";
import { ContactForm } from "@/components/ContactForm";
import { IntakeModal, IntakeType } from "@/components/IntakeModal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { HeaderAccountMenu } from "@/components/account/HeaderAccountMenu";

export function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [modalType, setModalType] = useState<IntakeType | null>(null);
  async function openModal(type: IntakeType) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.assign(`/login?next=${encodeURIComponent(BOOKING_URL)}`);
      return;
    }
    setModalType(type);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => entry.target.classList.add("visible"), i * 55);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar navOpen={navOpen} setNavOpen={setNavOpen} />
      <Hero />
      <TrustBar />
      <WeddingSection />
      <PermanentMakeupSection openModal={openModal} />
      <About />
      <Services openModal={openModal} />
      <Gallery />
      <Process />
      <Memberships />
      <ServiceArea />
      <FinalCta />
      <ContactForm />
      <Footer />
      <a href={PHONE_SMS} className="sticky-call sticky-text" aria-label="Text Lilly">Text</a>
      <a href={BOOKING_URL} className="sticky-book-bar">Inquire About Your Wedding or Book Now</a>
      <IntakeModal type={modalType} onClose={() => setModalType(null)} />
    </>
  );
}

function Navbar({ navOpen, setNavOpen }: { navOpen: boolean; setNavOpen: (open: boolean) => void }) {
  return (
    <nav>
      <a href="#" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></a>
      <ul className={`nav-links ${navOpen ? "open" : ""}`}>
        {["Weddings", "Permanent Makeup", "About", "Memberships", "Gallery", "Contact"].map((label) => (
          <li key={label}>
            <a href={`#${label === "Permanent Makeup" ? "permanent-makeup" : label.toLowerCase()}`} onClick={() => setNavOpen(false)}>{label}</a>
          </li>
        ))}
        <li><a href={GIFT_CARD_URL}>Gift Cards</a></li>
        <li><a href={BOOKING_URL} className="nav-book">Book Now</a></li>
      </ul>
      <HeaderAccountMenu />
      <button className="hamburger" onClick={() => setNavOpen(!navOpen)} aria-label="Menu"><span /><span /><span /></button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-content">
        <p className="hero-eyebrow">Wedding Makeup · Permanent Makeup · Cincinnati, Ohio</p>
        <h1>Your Wedding Day Deserves an <em>Artist</em>, Not Just a Makeup Artist</h1>
        <p className="hero-sub">Certified wedding makeup artist and permanent makeup specialist serving brides and clients throughout Cincinnati, Ohio.</p>
        <div className="hero-ctas"><a href="#weddings" className="btn-primary">Inquire About Your Wedding</a><a href="#permanent-makeup" className="btn-outline">Permanent Makeup</a></div>
      </div>
      <div className="hero-image-wrap"><img src="https://static.wixstatic.com/media/f2efde_c9b616b2fe3b4860966f354d643e65c9~mv2.jpg/v1/fill/w_1200,h_900,al_c,q_85/f2efde_c9b616b2fe3b4860966f354d643e65c9~mv2.jpg" alt="Lillyan's Beauty Studio - Wedding & Permanent Makeup Artist Cincinnati Ohio" /><div className="hero-image-overlay" /></div>
      <div className="hero-accent-bar" />
    </section>
  );
}

function TrustBar() {
  return <div className="trust-bar"><div className="trust-items">{["Certified Wedding Makeup Artist", "Licensed Permanent Makeup Specialist", "Licensed Esthetician", "Serving Cincinnati, Ohio"].map((item) => <div className="trust-item" key={item}><span className="trust-dot" />{item}</div>)}</div><a href={`tel:${PHONE_TEL}`} className="trust-cta">Call {PHONE}</a></div>;
}

function WeddingSection() {
  return (
    <section className="wedding-section" id="weddings"><div className="wedding-inner"><div className="wedding-img"><div className="wedding-img-placeholder"><p>Wedding gallery coming soon</p></div><div className="wedding-badge"><p>Available For</p><strong>Bridal Parties & Weddings</strong></div></div><div className="wedding-content reveal"><p className="section-label">For Brides & Their Parties</p><h2>Wedding Makeup That <em>Lasts</em> Through Every Moment</h2><p>Your wedding day is one of the most photographed days of your life. Lilly brings precision, calm, and professional artistry to every bridal appointment - so you look flawless from the first look to the last dance.</p><ul className="wedding-perks">{["Bridal trials available - see your look before the big day", "Full bridal party bookings welcome", "Long-wear techniques built for photography and tears", "On-location or in-studio options", "Available for weddings in Cincinnati, Ohio and beyond. Travel within the United States may be available when travel expenses are covered.", "Early booking recommended - dates fill quickly"].map((x) => <li key={x}><span className="wedding-perk-dot">✦</span>{x}</li>)}</ul><div className="wedding-ctas"><a href="#contact" className="btn-primary">Inquire About Your Wedding Date</a><a href={`tel:${PHONE_TEL}`} className="btn-outline-white">Call to Check Availability</a></div></div></div></section>
  );
}

function PermanentMakeupSection({ openModal }: { openModal: (type: IntakeType) => void }) {
  const services = ["Microblading", "Powder / Ombre Brows", "Lip Blush", "Permanent Eyeliner", "Touch-Up / Correction Session"];
  return (
    <section className="pmu-section" id="permanent-makeup"><div className="pmu-inner"><div className="pmu-content reveal"><p className="section-label">Wake Up Beautiful</p><h2 className="section-title">Permanent Makeup That <em>Changes</em> Your Morning</h2><p className="section-sub">Stop spending time on brows and liner every day. Permanent makeup is an investment in your confidence - results that look natural, last for years, and survive every swim, sweat, and cry.</p><div className="pmu-benefits">{[["✦", "Microblading & Powder Brows", "Natural hairstrokes or soft powder fill - customized to your face shape and bone structure."], ["◈", "Lip Blush", "Add definition, symmetry, and a hint of color that stays put - no reapplying after meals."], ["◉", "Permanent Eyeliner", "Wake up with defined eyes. Perfect for clients who struggle with liner or want a low-maintenance routine."], ["◐", "Touch-Ups & Corrections", "Had work done elsewhere? Lilly offers color corrections and touch-ups to refresh or improve existing permanent makeup."]].map(([icon, title, text]) => <div className="pmu-benefit" key={title}><div className="pmu-benefit-icon">{icon}</div><h4>{title}</h4><p>{text}</p></div>)}</div><ul className="pmu-services-list">{services.map((s) => <li key={s}><span>{s}</span><button className="pmu-intake-btn" onClick={() => openModal("permanent_makeup")}>Fill Intake Form</button></li>)}</ul><div className="inline-actions"><a href={BOOKING_URL} className="btn-primary">Book Permanent Makeup</a><button onClick={() => openModal("permanent_makeup")} className="btn-outline">Start Intake Form</button></div></div><div className="pmu-image-stack reveal"><div className="pmu-main-img"><img src="https://static.wixstatic.com/media/f2efde_5753eaff20c34d1a93b76321ef4f34e7~mv2.jpg/v1/fill/w_600,h_800,al_c,q_85/f2efde_5753eaff20c34d1a93b76321ef4f34e7~mv2.jpg" alt="Permanent makeup results at Lillyan's Beauty Studio" /></div><div className="pmu-stat-card"><strong>2-3 yr</strong><span>Average Lasting Results</span></div></div></div></section>
  );
}

function About() {
  return <section className="about" id="about"><div className="reveal"><p className="section-label">Meet Lilly</p><h2 className="section-title">Hi! I&apos;m <em>Lilly</em></h2><p className="mini-label">Licensed Esthetician & Certified Permanent/Formal Makeup Artist</p><blockquote className="mission-quote">&quot;Lillyan&apos;s Beauty Studio strives to enrich, enhance, and encourage individuals through their beauty.&quot;</blockquote><p className="section-sub">Based in Cincinnati, Ohio, my passion is bridal artistry and permanent makeup - two services where precision and trust matter most. Every client gets my full attention in a clean, calm, professional space. My goal is to one day work exclusively with brides and permanent makeup clients, and every appointment I take is a step toward that.</p><a href="/about" className="btn-outline">Get to Know Me</a></div><div className="about-image-wrap reveal"><div className="about-image-frame"><img src="https://static.wixstatic.com/media/f2efde_5753eaff20c34d1a93b76321ef4f34e7~mv2.jpg/v1/fill/w_600,h_800,al_c,q_85/f2efde_5753eaff20c34d1a93b76321ef4f34e7~mv2.jpg" alt="Lilly - Licensed Esthetician & Permanent Makeup Artist" /></div><div className="about-badge"><strong>Licensed & Certified</strong><p>Esthetician · Permanent Makeup Artist</p></div></div></section>;
}

function Services({ openModal }: { openModal: (type: IntakeType) => void }) {
  const cards = [["Facials", "Customized treatments for cleansing, hydration, and skin renewal.", "facial"], ["Waxing", "Face and body waxing in a clean, comfortable studio setting.", "waxing"], ["Brow Lifts & Tints", "Professional lift and tint for naturally defined, shaped brows.", ""], ["Lash Lifts & Tints", "Beautifully curled, darkened lashes - no mascara needed.", ""]];
  return <div className="additional-services" id="services"><p className="additional-label reveal">Also Available</p><h3 className="additional-title reveal">Additional Beauty Services</h3><p className="additional-sub reveal">While weddings and permanent makeup are the heart of the studio, Lilly also offers facials, waxing, lash lifts, brow lifts, and tints for clients looking for regular beauty maintenance.</p><div className="additional-grid reveal">{cards.map(([name, desc, type]) => <div className="additional-card" key={name}><div className="additional-card-name">{name}</div><p className="additional-card-desc">{desc}</p><a href={BOOKING_URL} className="additional-card-link">Book →</a>{type && <button className="intake-small" onClick={() => openModal(type as IntakeType)}>Intake form required - fill here</button>}</div>)}</div></div>;
}

function Gallery() {
  const items = [["Bridal Look", "Wedding Makeup", "wide"], ["Powder Brows", "Permanent Makeup", ""], ["Lip Blush", "Permanent Makeup", ""], ["Lash Lift", "Lift & Tint", ""], ["Bridal Trial", "Wedding Makeup", ""], ["Brow Tint", "Brows & Lifts", ""]];
  return <section id="gallery"><p className="section-label reveal">Real Results</p><h2 className="section-title reveal">Our <em>Work</em></h2><p className="section-sub reveal">Browse results from the studio - wedding looks, permanent makeup, lifts, and more.</p><div className="gallery-filters reveal">{["All Work", "Wedding Makeup", "Permanent Makeup", "Lifts & Tints", "Facials"].map((x, i) => <button className={`filter-btn ${i === 0 ? "active" : ""}`} key={x}>{x}</button>)}</div><div className="gallery-grid reveal">{items.map(([name, cat, wide]) => <div className={`gallery-item ${wide}`} key={name}><div className="gallery-placeholder">{name}<span>{cat}</span></div></div>)}</div><div className="gallery-ctas reveal"><a href="https://www.instagram.com/lillyans_beautystudio/" target="_blank" className="btn-primary">View Full Gallery</a><a href="#contact" className="btn-outline">Book Your Look</a></div></section>;
}

function Process() {
  return <section className="process"><div className="center-block"><p className="section-label reveal">Simple Steps</p><h2 className="section-title reveal">How to <em>Book</em></h2></div><div className="process-steps">{[["1", "Choose Your Service", "Wedding makeup, permanent makeup, or one of our additional beauty services - select what's right for you."], ["2", "Complete Intake Form", "Permanent makeup, facials, and waxing require a medical history form. Your info is saved securely for future visits."], ["3", "Confirm & Deposit", "Confirm your appointment and pay any required deposit. Gift card holders can waive the deposit entirely."], ["4", "Arrive Prepared", "Review pre-care instructions before your appointment for the very best results."]].map(([n, t, d]) => <div className="step reveal" key={n}><div className="step-num">{n}</div><div className="step-title">{t}</div><p className="step-desc">{d}</p></div>)}</div><div className="text-center"><a href={BOOKING_URL} className="btn-primary reveal">Start Booking</a></div></section>;
}

function Memberships() {
  const plans = [
    { name: "Glow", price: "$60", tag: "", perks: ["Choose 1 monthly: signature facial or brow tint & lami or lash lift & tint.", "Includes 10% off services & retail, priority booking, and a free birthday add-on!"] },
    { name: "Radiance", price: "$130", tag: "BEST VALUE", perks: ["Choose 2 monthly: customized facial plus brow or lash lift & tint every 6–8 weeks, rotated as needed.", "Includes 15% off services & retail, priority booking, and an upgraded birthday gift!"] },
    { name: "Luminary", price: "$200", tag: "", perks: ["Monthly premium facial + add-on, brow and lash lift & tint every 6–8 weeks, rotated as needed, up to $75/month in waxing.", "20% off services & retail, priority booking, and a premium birthday gift!"] }
  ];
  return <section className="memberships" id="memberships"><p className="section-label reveal">For Regular Clients</p><h2 className="section-title reveal">Find Your <em>Perfect Fit</em></h2><p className="section-sub reveal">Make self-care routine and save. Members enjoy exclusive discounts, priority booking, and perks - every month.</p><div className="membership-grid">{plans.map((plan, i) => <div className={`membership-card ${i === 1 ? "featured" : ""} reveal`} key={plan.name}>{plan.tag && <div className="membership-featured-tag">{plan.tag}</div>}<div className="membership-body"><div className="membership-name">{plan.name}</div><div className="membership-price"><strong>{plan.price}</strong><br />Every month</div><ul className="membership-perks">{plan.perks.map((p) => <li key={p}><span className="perk-dot">✦</span>{p}</li>)}</ul><a href="/memberships" className={i === 1 ? "btn-primary full-btn" : "btn-outline full-btn"}>Select</a><p className="membership-note">Month-to-month. Cancel anytime.</p></div></div>)}</div><div className="text-center"><a href={`tel:${PHONE_TEL}`} className="btn-black">Call to Ask About Memberships</a></div></section>;
}

function ServiceArea() {
  return <section className="service-area"><div className="reveal"><p className="section-label">Where We Serve</p><h2 className="section-title">Serving Cincinnati, Ohio</h2><p className="section-sub">Located at 152 W Pike St in Fayetteville, OH and serving brides and clients throughout Cincinnati, Ohio. Available for weddings in Cincinnati, Ohio and beyond. Travel within the United States may be available when travel expenses are covered.</p><div className="area-tags">{["Cincinnati, Ohio", "Southwest Ohio", "Wedding Travel Available"].map((x) => <span className="area-tag" key={x}>{x}</span>)}</div><div className="area-btns"><a href={MAPS_URL} target="_blank" className="btn-white">Get Directions</a><a href={`tel:${PHONE_TEL}`} className="btn-ghost-white">Call Now</a></div></div><div className="area-map reveal"><p>152 W Pike St<br />Fayetteville, OH 45118</p><small>Click &quot;Get Directions&quot; to open in Google Maps</small></div></section>;
}

function FinalCta() {
  return <section className="final-cta"><div className="final-cta-inner"><p className="section-label reveal">Ready to Book?</p><h2 className="section-title reveal">Let&apos;s Make Your <em>Vision</em> a Reality</h2><p className="section-sub reveal">Whether it&apos;s your wedding day or a permanent makeup procedure - reach out to check availability, ask questions, or reserve your date. Gift cards also available.</p><div className="final-cta-btns reveal"><a href="#contact" className="btn-primary">Inquire Now</a><a href={GIFT_CARD_URL} className="btn-outline">Buy a Gift Card</a></div></div></section>;
}

function Footer() {
  return <footer><div className="footer-grid"><div className="footer-brand"><a href="#" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></a><p>Certified wedding makeup artist and permanent makeup specialist serving Cincinnati, Ohio.</p><div className="footer-social"><SocialLink href="https://www.instagram.com/lillyans_beautystudio/" label="Instagram"><InstagramIcon /></SocialLink><SocialLink href="https://www.facebook.com/lillyansbeautystudio" label="Facebook"><FacebookIcon /></SocialLink><SocialLink href="https://www.tiktok.com/@lillyans_beautystudio" label="TikTok"><TikTokIcon /></SocialLink></div></div><div className="footer-col"><h4>Priority Services</h4><ul>{["Wedding Makeup", "Permanent Makeup", "Microblading", "Powder Brows", "Lip Blush"].map((x) => <li key={x}><a href={x === "Wedding Makeup" ? "#weddings" : "#permanent-makeup"}>{x}</a></li>)}</ul></div><div className="footer-col"><h4>Studio</h4><ul><li><a href="/about">About Lilly</a></li><li><a href="/memberships">Memberships</a></li><li><a href="#gallery">Gallery</a></li><li><a href="/care">Pre + Post Care</a></li><li><a href={GIFT_CARD_URL}>Gift Cards</a></li></ul></div><div className="footer-col"><h4>Contact</h4><ul><li><a href={`tel:${PHONE_TEL}`}>{PHONE}</a></li><li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li><li><a href={MAPS_URL} target="_blank">{ADDRESS}</a></li></ul></div></div><div className="footer-bottom"><p>© 2025 Lillyan&apos;s Beauty Studio · Cincinnati, Ohio · All rights reserved.</p><p>Certified Wedding Makeup Artist · Licensed Permanent Makeup Specialist</p></div></footer>;
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="social-link" aria-label={label}>{children}</a>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="5" width="14" height="14" rx="4" /><circle cx="12" cy="12" r="3.2" /><circle cx="16.6" cy="7.4" r=".8" /></svg>;
}

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 8.2h2V5h-2.4C10.8 5 9 6.8 9 9.6V12H7v3.1h2V20h3.4v-4.9h2.7l.5-3.1h-3.2V9.9c0-1.1.5-1.7 1.6-1.7Z" /></svg>;
}

function TikTokIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.2 4.8c.4 2.4 1.8 3.9 4 4.2v3.1a7 7 0 0 1-4-1.3v4.6c0 3-2 5.2-5 5.2A4.8 4.8 0 0 1 4.4 16c0-3.2 2.8-5.4 6-4.8v3.2c-1.5-.5-2.8.4-2.8 1.7 0 1 .8 1.7 1.8 1.7 1.1 0 1.8-.7 1.8-2.1V4.8h3Z" /></svg>;
}
