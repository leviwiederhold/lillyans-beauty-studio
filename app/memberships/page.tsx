import { EMAIL } from "@/lib/constants";

export default function MembershipsPage() {
  return (
    <main className="policy-page">
      <h1>Memberships</h1>
      <p>Membership signup is handled internally by Lillyan&apos;s Beauty Studio. Ask about current membership options and availability.</p>
      <p><a className="btn-primary" href="/book">Book a Service</a></p>
      <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </main>
  );
}
