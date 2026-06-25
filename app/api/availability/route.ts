import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateSlots, easternDayBounds } from "@/lib/availability";
import { availabilityQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = availabilityQuerySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const { service_id, date } = parsed.data;
  const service = await supabase.from("services").select("*").eq("id", service_id).eq("is_active", true).single();
  if (service.error) return NextResponse.json({ error: "Service not found." }, { status: 404 });

  const { dayStart, dayEnd } = easternDayBounds(date);

  const [rules, bookings, blocked, override, settings] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("is_active", true),
    supabase.from("bookings").select("starts_at,ends_at").in("status", ["pending", "confirmed"]).gte("starts_at", dayStart).lte("starts_at", dayEnd),
    supabase.from("blocked_times").select("starts_at,ends_at").lte("starts_at", dayEnd).gte("ends_at", dayStart),
    supabase.from("business_hour_overrides").select("*").eq("override_date", date).maybeSingle(),
    supabase.from("business_settings").select("booking_minimum_notice_hours").eq("id", 1).maybeSingle(),
  ]);
  const minNoticeHours = Number(settings.data?.booking_minimum_notice_hours ?? 48);

  // If a date override exists and the day is closed, return empty slots
  if (override.data?.is_closed) {
    return NextResponse.json({ slots: [], service: service.data });
  }

  // Build effective rules: start with weekly rules, then apply date override if present
  let effectiveRules = rules.data || [];
  if (override.data && !override.data.is_closed && override.data.opens_at && override.data.closes_at) {
    // Replace the weekly rule for this day with the override hours
    const day = new Date(`${date}T12:00:00`).getDay();
    effectiveRules = effectiveRules.filter((r) => r.day_of_week !== day);
    effectiveRules.push({
      day_of_week: day,
      start_time: override.data.opens_at,
      end_time: override.data.closes_at,
      is_active: true,
    });
  }

  const slots = generateSlots({
    date,
    durationMinutes: service.data.duration_minutes || 60,
    rules: effectiveRules,
    bookings: (bookings.data || []).filter((b) => b.starts_at && b.ends_at) as { starts_at: string; ends_at: string }[],
    blockedTimes: blocked.data || [],
    minNoticeHours
  });
  return NextResponse.json({ slots, service: service.data });
}
