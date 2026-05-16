import { AppNav } from "@/components/AppNav";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <main className="policy-page-app">
        <h1>Terms &amp; Conditions</h1>
        <p>By booking with Lillyan&apos;s Beauty Studio, you agree to the following terms.</p>
        <p>Booking requests are pending until confirmed by the studio. A deposit may be required to hold your appointment date and time.</p>
        <p>Clients are responsible for providing accurate health and intake information. Any changes in health, medications, or allergies must be communicated before future appointments.</p>
        <p>Lillyan&apos;s Beauty Studio reserves the right to decline a service if, in the professional judgment of the artist/esthetician, proceeding would be unsafe or inadvisable.</p>
      </main>
    </div>
  );
}
