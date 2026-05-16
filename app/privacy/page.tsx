import { AppNav } from "@/components/AppNav";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <main className="policy-page-app">
        <h1>Privacy Policy</h1>
        <p>Lillyan&apos;s Beauty Studio collects contact, booking, membership, and intake information to provide beauty services safely and professionally.</p>
        <p>Medical and intake information is kept private, stored securely, and is available only to approved admin users and the client account associated with the record.</p>
        <p>Information is not sold or shared with third parties. Email may be used for appointment confirmations, booking communication, and service follow-up.</p>
        <p>By creating an account or submitting an intake form, you consent to your information being stored and used to provide services and communications related to your appointments.</p>
      </main>
    </div>
  );
}
