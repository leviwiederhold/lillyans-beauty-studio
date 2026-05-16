import { AppNav } from "@/components/AppNav";

export default function BookingPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <main className="policy-page-app">
        <h1>Terms &amp; Booking Policy</h1>
        <p>Booking requests are pending until confirmed by Lillyan&apos;s Beauty Studio. Deposits may be required unless a valid gift card or no-deposit code is accepted.</p>
        <p>Clients are responsible for accurate intake information and must notify the studio of any health changes before future appointments.</p>
        <p>Cancellations made within 24 hours of the appointment may result in a forfeited deposit. Wedding and travel deposit policies are outlined in your booking agreement.</p>
        <p>Cancellation, travel, wedding, and deposit policies can be reviewed with the studio by contacting Lilly directly.</p>
        <div style={{ marginTop: "1.5rem" }}>
          <a href="/book" className="btn-primary" style={{ display: "inline-block" }}>Book an Appointment</a>
        </div>
      </main>
    </div>
  );
}
