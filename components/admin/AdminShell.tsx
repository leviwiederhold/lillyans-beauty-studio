import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function buildSidebar(unreviewedForms: number) {
  return [
    {
      label: "Operations",
      links: [
        { href: "/admin", label: "Overview", icon: "layout-dashboard", badge: 0 },
        { href: "/admin/calendar", label: "Calendar", icon: "calendar", badge: 0 },
        { href: "/admin/bookings", label: "Bookings", icon: "notebook", badge: 0 },
        { href: "/admin/clients", label: "Clients", icon: "users", badge: 0 },
        { href: "/admin/intake-forms", label: "Intake Forms", icon: "clipboard-text", badge: unreviewedForms }
      ]
    },
    {
      label: "Business",
      links: [
        { href: "/admin/memberships", label: "Memberships", icon: "crown", badge: 0 },
        { href: "/admin/services", label: "Services", icon: "scissors", badge: 0 },
        { href: "/admin/business-hours", label: "Business Hours", icon: "clock", badge: 0 },
        { href: "/admin/blocked-times", label: "Blocked Times", icon: "ban", badge: 0 },
        { href: "/admin/gift-cards", label: "Gift Cards", icon: "gift", badge: 0 }
      ]
    },
    {
      label: "Content",
      links: [
        { href: "/admin/gallery", label: "Gallery", icon: "photo", badge: 0 },
        { href: "/admin/settings", label: "Website Settings", icon: "settings", badge: 0 }
      ]
    }
  ];
}

export async function AdminShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
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
    <div className="admin-shell">
      <nav className="sidebar">
        <div className="sb-brand">
          <Link href="/admin" className="sb-brand-name">Lillyan&apos;s <em>Beauty Studio</em></Link>
          <div className="sb-brand-sub">Admin Portal</div>
        </div>
        <div className="sb-nav">
          {SIDEBAR.map((section) => (
            <div key={section.label}>
              <div className="sb-section-label">{section.label}</div>
              {section.links.map((link) => (
                <AdminSidebarNav key={link.href} href={link.href} label={link.label} icon={link.icon} badge={link.badge} />
              ))}
            </div>
          ))}
        </div>
        <div className="sb-footer">
          <div className="sb-avatar">
            <div className="sb-avatar-circle">L</div>
            <div><div className="sb-avatar-name">Lilly</div><div className="sb-avatar-role">Studio Owner</div></div>
          </div>
        </div>
      </nav>
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{title.includes("Admin") ? "Overview" : title}</div>
          <div className="topbar-right">
            <div className="tb-search"><span className="ti ti-search" aria-hidden="true" /><input placeholder="Search clients, bookings..." /></div>
            <Link href="/" className="tb-btn" title="View site" aria-label="View site"><span className="ti ti-external-link" aria-hidden="true" /></Link>
            <Link href="/admin/bookings" className="tb-add"><span className="ti ti-plus" aria-hidden="true" />Quick Add</Link>
          </div>
        </div>
        <div className="mobile-admin-nav">
          {SIDEBAR.flatMap((section) => section.links).map((link) => (
            <AdminSidebarNav key={link.href} href={link.href} label={link.label} icon={link.icon} badge={link.badge} />
          ))}
        </div>
        <main className="content">
          {eyebrow && (
            <div className="page-hdr">
              <div className="page-eyebrow">{eyebrow}</div>
              <div className="page-title">{title}</div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
