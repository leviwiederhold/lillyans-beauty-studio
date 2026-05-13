import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateSlots } from "@/lib/availability";
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

  const dayStart = new Date(`${date}T00:00:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59`).toISOString();
  const [rules, bookings, blocked] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("is_active", true),
    supabase.from("bookings").select("starts_at,ends_at").in("status", ["pending", "confirmed"]).gte("starts_at", dayStart).lte("starts_at", dayEnd),
    supabase.from("blocked_times").select("starts_at,ends_at").lte("starts_at", dayEnd).gte("ends_at", dayStart)
  ]);

  const slots = generateSlots({
    date,
    durationMinutes: service.data.duration_minutes || 60,
    rules: rules.data || [],
    bookings: (bookings.data || []).filter((b) => b.starts_at && b.ends_at) as { starts_at: string; ends_at: string }[],
    blockedTimes: blocked.data || []
  });
  return NextResponse.json({ slots, service: service.data });
}
