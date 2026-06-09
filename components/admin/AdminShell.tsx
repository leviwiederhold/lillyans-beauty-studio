import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function buildSidebar(unreviewedForms: number) {
  return [
    {
      label: "Overview",
      links: [
        { href: "/admin", label: "Dashboard", icon: "home", badge: 0 },
        { href: "/admin/calendar", label: "Calendar", icon: "calendar", badge: 0 }
      ]
    },
    {
      label: "Bookings",
      links: [
        { href: "/admin/bookings", label: "All Bookings", icon: "book", badge: 0 },
        { href: "/admin/client-forms", label: "Intake Forms", icon: "clipboard", badge: unreviewedForms }
      ]
    },
    {
      label: "Clients",
      links: [
        { href: "/admin/clients", label: "Client List", icon: "users", badge: 0 },
        { href: "/admin/memberships", label: "Memberships", icon: "star", badge: 0 }
      ]
    },
    {
      label: "Store",
      links: [
        { href: "/admin/services", label: "Services", icon: "tag", badge: 0 },
        { href: "/admin/gift-card-inquiries", label: "Gift Card Inquiries", icon: "gift", badge: 0 },
        { href: "/admin/gift-card-codes", label: "Gift Card Codes", icon: "code", badge: 0 }
      ]
    },
    {
      label: "Studio",
      links: [
        { href: "/admin/business-hours", label: "Business Hours", icon: "clock", badge: 0 },
        { href: "/admin/blocked-times", label: "Blocked Times", icon: "ban", badge: 0 },
        { href: "/admin/gallery", label: "Gallery", icon: "image", badge: 0 },
        { href: "/admin/settings", label: "Settings", icon: "settings", badge: 0 }
      ]
    }
  ];
}

export async function AdminShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  // Fetch unreviewed client forms count for sidebar badge
  const supabase = createSupabaseAdminClient();
  let unreviewedForms = 0;
  if (supabase) {
    const { count } = await supabase
      .from("client_forms")
      .select("id", { count: "exact", head: true })
      .eq("reviewed", false);
    unreviewedForms = count ?? 0;
  }
  const SIDEBAR = buildSidebar(unreviewedForms);
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
                <AdminSidebarNav key={link.href} href={link.href} label={link.label} icon={link.icon} badge={link.badge} />
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
