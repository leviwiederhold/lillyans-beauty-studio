"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; badge?: number };
type Section = { label: string; items: Item[] };

function buildSections(unreviewedForms: number, pendingBookings: number): Section[] {
  return [
    {
      label: "Operations",
      items: [
        { href: "/admin", label: "Overview", icon: "ti-layout-dashboard" },
        { href: "/admin/calendar", label: "Calendar", icon: "ti-calendar" },
        { href: "/admin/bookings", label: "Bookings", icon: "ti-notebook", badge: pendingBookings },
        { href: "/admin/clients", label: "Clients", icon: "ti-users" },
        { href: "/admin/intake-forms", label: "Intake Forms", icon: "ti-clipboard-text", badge: unreviewedForms },
      ],
    },
    {
      label: "Business",
      items: [
        { href: "/admin/memberships", label: "Memberships", icon: "ti-crown" },
        { href: "/admin/services", label: "Services", icon: "ti-scissors" },
        { href: "/admin/business-hours", label: "Business Hours", icon: "ti-clock" },
        { href: "/admin/blocked-times", label: "Blocked Times", icon: "ti-ban" },
        { href: "/admin/gift-cards", label: "Gift Cards", icon: "ti-gift" },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/admin/gallery", label: "Gallery", icon: "ti-photo" },
        { href: "/admin/settings", label: "Website Settings", icon: "ti-settings" },
      ],
    },
  ];
}

export function Sidebar({
  unreviewedForms = 0,
  pendingBookings = 0,
  adminName = "Lilly",
  adminInitial = "L",
}: {
  unreviewedForms?: number;
  pendingBookings?: number;
  adminName?: string;
  adminInitial?: string;
}) {
  const pathname = usePathname();
  const sections = buildSections(unreviewedForms, pendingBookings);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="sidebar">
      <Link href="/" className="sb-brand">
        <div className="sb-brand-name">Lillyan&apos;s <em>Beauty Studio</em></div>
        <div className="sb-brand-sub">Admin Portal</div>
      </Link>
      <div className="sb-nav">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="sb-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link key={item.href} href={item.href} className={`sb-item${isActive(item.href) ? " active" : ""}`}>
                <i className={`ti ${item.icon}`} />
                {item.label}
                {item.badge ? <span className="notif">{item.badge}</span> : null}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="sb-footer">
        <Link href="/account/settings" className="sb-avatar">
          <div className="sb-avatar-circle">{adminInitial}</div>
          <div>
            <div className="sb-avatar-name">{adminName}</div>
            <div className="sb-avatar-role">Studio Owner</div>
          </div>
        </Link>
      </div>
    </nav>
  );
}
