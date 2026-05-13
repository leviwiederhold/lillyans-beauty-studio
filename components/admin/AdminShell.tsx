import Link from "next/link";
import { AdminSearch } from "@/components/admin/AdminSearch";

const links = [
  ["/admin", "Overview"],
  ["/admin/bookings", "Bookings"],
  ["/admin/calendar", "Calendar"],
  ["/admin/memberships", "Memberships"],
  ["/admin/clients", "Clients"],
  ["/admin/intake-forms", "Intake Forms"],
  ["/admin/settings", "Settings"],
  ["/admin/gallery", "Gallery"],
  ["/admin/gift-codes", "Gift Codes"],
  ["/admin/gift-card-inquiries", "Gift Card Inquiries"],
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
      <div className="admin-nav" aria-label="Admin navigation">
        {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </div>
      <AdminSearch />
      {children}
    </main>
  );
}
