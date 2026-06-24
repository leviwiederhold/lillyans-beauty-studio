import { AdminShell } from "@/components/admin/AdminShell";
import { StatGrid } from "@/components/admin/AdminDataViews";
import { BookingManager } from "@/components/admin/BookingManager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  let query = supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone), client_forms:client_form_id(form_type,submitted_at,last_reviewed_at)").order("starts_at", { ascending: false }).limit(200);
  if (params.status && params.status !== "all") query = query?.eq("status", params.status);
  const bookings = await query;
  const rows = bookings?.data || [];
  const now = Date.now();

  return (
    <AdminShell title="Bookings & Inquiries" eyebrow="Admin / Bookings">
      <div className="admin-filter-links">
        {["all", "pending", "pending_admin_confirmation", "confirmed", "denied", "cancelled", "completed", "no-show"].map((s) => <a key={s} href={`/admin/bookings?status=${s}`}>{s}</a>)}
      </div>
      <StatGrid stats={[
        { label: "Upcoming", value: rows.filter((r) => r.starts_at && new Date(r.starts_at).getTime() >= now).length },
        { label: "Past", value: rows.filter((r) => r.starts_at && new Date(r.starts_at).getTime() < now).length },
        { label: "Pending", value: rows.filter((r) => r.status === "pending").length },
        { label: "Confirmed", value: rows.filter((r) => r.status === "confirmed").length },
        { label: "Cancelled", value: rows.filter((r) => r.status === "cancelled").length }
      ]} />
      <BookingManager rows={rows} />
    </AdminShell>
  );
}
