import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/ui/Sidebar";
import { AdminTopbar } from "@/components/admin/ui/AdminTopbar";
import { PageHeader } from "@/components/admin/ui/components";
import type { ReactNode } from "react";

// Admin shell: rose design-system layout (sidebar + topbar + content), scoped
// under .lbs-admin so it never affects the public site. Keeps the original
// {title, eyebrow, children} signature so every admin page works unchanged.
export async function AdminShell({
  title,
  eyebrow,
  children,
  hidePageHeader = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  hidePageHeader?: boolean;
}) {
  // Sidebar badge counts — never let a query failure break the shell.
  const supabase = createSupabaseAdminClient();
  let unreviewedForms = 0;
  let pendingBookings = 0;
  if (supabase) {
    try {
      const [forms, bookings] = await Promise.all([
        supabase.from("client_forms").select("id", { count: "exact", head: true }).eq("reviewed", false),
        supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["pending", "pending_admin_confirmation"]),
      ]);
      unreviewedForms = forms.count ?? 0;
      pendingBookings = bookings.count ?? 0;
    } catch {
      unreviewedForms = 0;
      pendingBookings = 0;
    }
  }

  return (
    <div className="lbs-admin">
      <div className="admin-shell">
        <Sidebar unreviewedForms={unreviewedForms} pendingBookings={pendingBookings} />
        <div className="main">
          <AdminTopbar title={title} />
          <div className="content">
            {!hidePageHeader && <PageHeader eyebrow={eyebrow} title={title} />}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
