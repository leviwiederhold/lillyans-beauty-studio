import { AppNav } from "@/components/AppNav";
import { ServicesGrid } from "@/components/ServicesGrid";

export default function ServicesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner wide">
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">Full Service Menu</p>
            <h1 className="sec-title">Services &amp; Pricing</h1>
            <p className="sec-sub">Browse all services by category. Book online or contact the studio with any questions.</p>
          </div>
          <ServicesGrid />
        </div>
      </div>
    </div>
  );
}
