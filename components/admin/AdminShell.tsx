import Link from "next/link";
import { AdminSearch } from "@/components/admin/AdminSearch";

const links = [
  ["/admin", "Overview"],
  ["/admin/bookings", "Bookings"],
  ["/admin/calendar", "Calendar"],
  ["/admin/clients", "Clients"],
  ["/admin/intake-forms", "Medical Forms"],
  ["/admin/memberships", "Memberships"],
  ["/admin/settings", "Services"],
  ["/admin/business-hours", "Business Hours"],
  ["/admin/blocked-times", "Blocked Times"],
  ["/admin/gift-card-inquiries", "Gift Card Inquiries"],
  ["/admin/gift-codes", "Gift Card Codes"],
  ["/admin/gallery", "Gallery"],
  ["/admin/website-settings", "Website Settings"],
  ["/admin/logs", "Logs"]
];

export function AdminShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <main className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="section-label">{eyebrow || "Protected Dashboard"}</p>
          <h1>{title}</h1>
        </div>
        <Link className="btn-outline" href="/">View Site</Link>
      </div>
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </aside>
        <div className="admin-content">
          <AdminSearch />
          {children}
        </div>
      </div>
    </main>
  );
}
