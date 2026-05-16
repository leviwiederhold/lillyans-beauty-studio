import { AppNav } from "@/components/AppNav";
import { GiftCardForm } from "@/components/GiftCardForm";

export default function GiftCardsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 620 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p className="sec-label">Give the Gift of Beauty</p>
            <h1 className="sec-title">Gift Cards</h1>
            <p className="sec-sub" style={{ maxWidth: 400, margin: "0 auto 1.5rem" }}>
              Treat someone special to a Lillyan&apos;s Beauty Studio experience. Fill out the form below and Lilly will be in touch to arrange everything.
            </p>
          </div>
          <GiftCardForm />
        </div>
      </div>
    </div>
  );
}
