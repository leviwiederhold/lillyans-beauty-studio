"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebarNav({ href, label, icon, badge = 0 }: { href: string; label: string; icon: string; badge?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link href={href} className={`sb-item${isActive ? " active" : ""}`}>
      <i className={`ti ti-${icon}`} aria-hidden="true" />
      {label}
      {badge > 0 && <span className="notif">{badge}</span>}
    </Link>
  );
}
