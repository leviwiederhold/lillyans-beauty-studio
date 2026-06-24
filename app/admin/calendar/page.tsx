import { AdminShell } from "@/components/admin/AdminShell";
import { FilterPills } from "@/components/admin/ui/components";
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
      <FilterPills
        basePath="/admin/calendar"
        param="status"
        active={params.status || "all"}
        options={[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "pending_admin_confirmation", label: "Needs confirm" },
          { value: "confirmed", label: "Confirmed" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />
      <AdminCalendarView bookings={bookings} blockedTimes={blockedTimes} />
    </AdminShell>
  );
}
