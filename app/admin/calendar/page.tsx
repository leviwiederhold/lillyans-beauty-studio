import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, bookingColumns } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ service?: string; status?: string; view?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  let query = supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").order("starts_at").limit(200);
  if (params.status) query = query?.eq("status", params.status);
  if (params.service) query = query?.eq("service_type", params.service);
  const bookings = await query;
  const rows = bookings?.data || [];

  return (
    <AdminShell title="Admin Calendar" eyebrow="Admin / Calendar">
      <div className="admin-filter-links">
        <a href="/admin/calendar?view=list">List View</a>
        <a href="/admin/calendar?view=calendar">Calendar View</a>
        {["pending", "pending_admin_confirmation", "confirmed", "completed", "cancelled", "no-show"].map((s) => <a key={s} href={`/admin/calendar?status=${s}`}>{s}</a>)}
      </div>
      <section className="admin-calendar">
        {rows.map((r) => <article key={r.id} className="admin-calendar-item"><strong>{r.starts_at ? new Date(r.starts_at).toLocaleDateString() : "No date"}</strong><span>{r.service_type}</span><small>{r.status}</small></article>)}
      </section>
      <DataTable title="Appointments" rows={rows} columns={bookingColumns} />
    </AdminShell>
  );
}
