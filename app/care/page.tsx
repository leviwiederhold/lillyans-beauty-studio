import { AppNav } from "@/components/AppNav";

export default function CarePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <main className="policy-page-app">
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--pink-dark)", fontWeight: 500, marginBottom: "0.5rem" }}>Prepare for Your Visit</p>
        <h1>Pre + Post Care</h1>
        <p>Service-specific care instructions are provided during booking and after your appointment. Please review the general guidance below.</p>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 300, marginTop: "1.8rem", marginBottom: "0.5rem" }}>Permanent Makeup</h2>
        <p>Avoid blood thinners (aspirin, alcohol, fish oil) 48 hours before your appointment. Come with clean, makeup-free skin. Avoid sun exposure and tanning for two weeks prior. Results vary by skin type; a touch-up session is often recommended 4–8 weeks after initial application.</p>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 300, marginTop: "1.8rem", marginBottom: "0.5rem" }}>Facials</h2>
        <p>Avoid retinol or exfoliants for 3 days before your facial. Arrive with clean skin and no heavy makeup. Stay out of the sun and avoid harsh products for 24 hours after your treatment.</p>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 300, marginTop: "1.8rem", marginBottom: "0.5rem" }}>Waxing</h2>
        <p>Hair should be at least ¼ inch long for best results. Exfoliate gently 24 hours before your appointment. Avoid waxing if you are using retinol or similar skin-thinning products.</p>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 300, marginTop: "1.8rem", marginBottom: "0.5rem" }}>Intake Forms</h2>
        <p>Complete your intake form before your first appointment for permanent makeup, facials, or waxing services. Your information is stored securely in your client account for future visits.</p>

        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <a href="/book" className="btn-primary">Book an Appointment</a>
          <a href="/account/intake" className="btn-outline">View My Intake Forms</a>
        </div>
      </main>
    </div>
  );
}
