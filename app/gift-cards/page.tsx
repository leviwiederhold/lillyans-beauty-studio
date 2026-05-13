import { EMAIL, PHONE_SMS } from "@/lib/constants";

export default function GiftCardsPage() {
  return (
    <main className="policy-page">
      <h1>Gift Cards</h1>
      <p>Gift cards are available by contacting Lillyan&apos;s Beauty Studio directly.</p>
      <p><a className="btn-primary" href={PHONE_SMS}>Text Lilly</a></p>
      <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </main>
  );
}
