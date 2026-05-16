import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";

const SIDEBAR = [
  {
    label: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: "home" },
      { href: "/admin/calendar", label: "Calendar", icon: "calendar" }
    ]
  },
  {
    label: "Bookings",
    links: [
      { href: "/admin/bookings", label: "All Bookings", icon: "book" },
      { href: "/admin/intake-forms", label: "Intake Forms", icon: "clipboard" }
    ]
  },
  {
    label: "Clients",
    links: [
      { href: "/admin/clients", label: "Client List", icon: "users" },
      { href: "/admin/memberships", label: "Memberships", icon: "star" },
      { href: "/admin/client-forms", label: "Client Forms", icon: "clipboard" }
    ]
  },
  {
    label: "Store",
    links: [
      { href: "/admin/services", label: "Services", icon: "tag" },
      { href: "/admin/gift-card-inquiries", label: "Gift Card Inquiries", icon: "gift" },
      { href: "/admin/gift-card-codes", label: "Gift Card Codes", icon: "code" }
    ]
  },
  {
    label: "Studio",
    links: [
      { href: "/admin/business-hours", label: "Business Hours", icon: "clock" },
      { href: "/admin/blocked-times", label: "Blocked Times", icon: "ban" },
      { href: "/admin/gallery", label: "Gallery", icon: "image" },
      { href: "/admin/settings", label: "Settings", icon: "settings" }
    ]
  }
];

export function AdminShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      {/* Top bar */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 400, color: "var(--black)", textDecoration: "none" }}>
          Lillyan&apos;s Beauty Studio
          <span style={{ display: "block", fontFamily: "'Jost', sans-serif", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--grey-light)" }}>Admin</span>
        </Link>
        <Link href="/" className="btn btn-ghost btn-sm">View Site</Link>
      </div>

      <div className="admin-layout-new">
        {/* Sidebar */}
        <aside className="admin-sidebar-new">
          {SIDEBAR.map((section) => (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-label">{section.label}</div>
              {section.links.map((link) => (
                <AdminSidebarNav key={link.href} href={link.href} label={link.label} icon={link.icon} />
              ))}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="admin-main-new">
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">{eyebrow || "Admin"}</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 300 }}>{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
