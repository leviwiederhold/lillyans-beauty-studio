import { AdminShell } from "@/components/admin/AdminShell";
import { BookingManager } from "@/components/admin/BookingManager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  let query = supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").order("starts_at", { ascending: false }).limit(200);
  if (params.status && params.status !== "all") query = query?.eq("status", params.status);
  const bookings = await query;
  const rows = bookings?.data || [];

  return (
    <AdminShell title="Bookings" eyebrow="Manage">
      <div className="filter-row">
        <div className="filter-search"><i className="ti ti-search" /><input placeholder="Search client or service..." /></div>
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["pending_admin_confirmation", "Admin review"],
          ["confirmed", "Confirmed"],
          ["completed", "Completed"],
          ["cancelled", "Cancelled"],
          ["no-show", "No-show"],
        ].map(([value, label]) => (
          <a key={value} className={`filter-pill${(params.status || "all") === value ? " active" : ""}`} href={`/admin/bookings?status=${value}`}>{label}</a>
        ))}
      </div>
      <BookingManager rows={rows} />
    </AdminShell>
  );
}
