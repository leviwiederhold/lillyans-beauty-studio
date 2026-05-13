import { EMAIL } from "@/lib/constants";

export default function MembershipsPage() {
  return (
    <main className="policy-page">
      <h1>Find Your Perfect Fit</h1>
      <p><strong>Glow - $60 every month.</strong> Choose 1 monthly: signature facial or brow tint &amp; lami or lash lift &amp; tint. Includes 10% off services &amp; retail, priority booking, and a free birthday add-on!</p>
      <p><strong>Radiance - $130 every month. BEST VALUE.</strong> Choose 2 monthly: customized facial plus brow or lash lift &amp; tint every 6-8 weeks, rotated as needed. Includes 15% off services &amp; retail, priority booking, and an upgraded birthday gift!</p>
      <p><strong>Luminary - $200 every month.</strong> Monthly premium facial + add-on, brow and lash lift &amp; tint every 6-8 weeks, rotated as needed, up to $75/month in waxing, 20% off services &amp; retail, priority booking, and a premium birthday gift!</p>
      <p>Membership signup is handled internally by Lillyan&apos;s Beauty Studio. Ask about current membership options and availability.</p>
      <p><a className="btn-primary" href="/book">Book a Service</a></p>
      <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </main>
  );
}
