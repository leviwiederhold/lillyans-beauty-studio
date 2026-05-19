import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { AdminCalendarView } from "@/components/admin/AdminCalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  let query = supabase?.from("bookings")
    .select("id, service_type, client_name, email, phone, status, starts_at, ends_at, notes, internal_notes, deposit_status")
    .order("starts_at")
    .limit(500);
  if (params.status) query = query?.eq("status", params.status);
  const [bookingsRes, blockedRes] = await Promise.all([
    query,
    supabase?.from("blocked_times").select("id, starts_at, ends_at, reason").order("starts_at"),
  ]);

  const bookings = (bookingsRes?.data || []) as Record<string, unknown>[];
  const blockedTimes = (blockedRes?.data || []) as { id: string; starts_at: string; ends_at: string; reason?: string }[];

  return (
    <AdminShell title="Calendar" eyebrow="Admin / Calendar">
      <div className="admin-filter-links" style={{ marginBottom: "1rem" }}>
        <a href="/admin/calendar">All</a>
        {["pending", "pending_admin_confirmation", "confirmed", "completed", "cancelled"].map((s) => (
          <a key={s} href={`/admin/calendar?status=${s}`}>{s}</a>
        ))}
      </div>
      <AdminCalendarView bookings={bookings} blockedTimes={blockedTimes} />
    </AdminShell>
  );
}
