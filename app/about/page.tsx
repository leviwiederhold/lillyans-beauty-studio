import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <main className="policy-page-app">
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--pink-dark)", fontWeight: 500, marginBottom: "0.5rem" }}>Meet Lilly</p>
        <h1>About Lilly</h1>
        <p>Lilly is a licensed esthetician and certified permanent/formal makeup artist serving Cincinnati, Ohio and the surrounding area.</p>
        <blockquote style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontStyle: "italic", fontWeight: 300, color: "var(--black)", lineHeight: 1.5, borderLeft: "3px solid var(--pink-dark)", paddingLeft: "1.4rem", margin: "1.8rem 0" }}>
          &ldquo;Lillyan&apos;s Beauty Studio strives to enrich, enhance, and encourage individuals through their beauty.&rdquo;
        </blockquote>
        <p>Based in Fayetteville, Ohio, Lilly specializes in bridal artistry and permanent makeup — two services where precision and trust matter most. Every client receives her full attention in a clean, calm, professional studio.</p>
        <p>Available for weddings in Cincinnati, Ohio and beyond. Travel within the United States may be available when travel expenses are covered.</p>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/book" className="btn-primary">Book an Appointment</Link>
          <Link href="/#contact" className="btn-outline">Contact Lilly</Link>
        </div>
      </main>
    </div>
  );
}
