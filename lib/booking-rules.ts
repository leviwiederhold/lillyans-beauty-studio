import { easternDayBounds, generateSlots } from "@/lib/availability";

type SupabaseAdmin = {
  from: (table: string) => any;
};

export async function assertBookingSlotAvailable({
  supabase,
  service,
  startsAt,
  excludeBookingId
}: {
  supabase: SupabaseAdmin;
  service: Record<string, any>;
  startsAt: string;
  excludeBookingId?: string;
}) {
  const starts = new Date(startsAt);
  const date = startsAt.slice(0, 10);
  const { dayStart, dayEnd } = easternDayBounds(date);

  const [rules, bookings, blocked, override] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("is_active", true),
    supabase.from("bookings").select("id,starts_at,ends_at").in("status", ["pending", "pending_admin_confirmation", "confirmed"]).gte("starts_at", dayStart).lte("starts_at", dayEnd),
    supabase.from("blocked_times").select("starts_at,ends_at").lte("starts_at", dayEnd).gte("ends_at", dayStart),
    supabase.from("business_hour_overrides").select("*").eq("override_date", date).maybeSingle()
  ]);

  if (override.data?.is_closed) return { ok: false as const, error: "That date is blocked off." };

  let effectiveRules = rules.data || [];
  if (override.data && !override.data.is_closed && override.data.opens_at && override.data.closes_at) {
    const day = new Date(`${date}T12:00:00`).getDay();
    effectiveRules = effectiveRules.filter((rule: Record<string, any>) => rule.day_of_week !== day);
    effectiveRules.push({
      day_of_week: day,
      start_time: override.data.opens_at,
      end_time: override.data.closes_at
    });
  }

  const busyBookings = (bookings.data || [])
    .filter((booking: Record<string, any>) => booking.id !== excludeBookingId && booking.starts_at && booking.ends_at)
    .map((booking: Record<string, any>) => ({ starts_at: booking.starts_at, ends_at: booking.ends_at }));

  const slots = generateSlots({
    date,
    durationMinutes: Number(service.duration_minutes || 60),
    rules: effectiveRules,
    bookings: busyBookings,
    blockedTimes: blocked.data || []
  });

  if (!slots.includes(starts.toISOString())) return { ok: false as const, error: "That time is no longer available." };

  return {
    ok: true as const,
    starts,
    ends: new Date(starts.getTime() + Number(service.duration_minutes || 60) * 60000)
  };
}
