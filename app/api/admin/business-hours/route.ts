import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const auth = await createSupabaseServerClient();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await auth.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { data: profile } = await supabase.from("profiles").select("is_admin,role").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_admin && profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const hours: Array<{ day_of_week: number; opens_at: string; closes_at: string; is_closed: boolean }> = body.hours || [];

  for (const h of hours) {
    // Save to business_hours
    await supabase.from("business_hours").upsert({
      day_of_week: h.day_of_week,
      opens_at: h.is_closed ? null : h.opens_at,
      closes_at: h.is_closed ? null : h.closes_at,
      is_closed: h.is_closed,
      updated_at: new Date().toISOString()
    }, { onConflict: "day_of_week" });

    // Sync to availability_rules (what the slot generator actually reads)
    if (h.is_closed || !h.opens_at || !h.closes_at) {
      // Remove any existing rules for this day
      await supabase.from("availability_rules").delete().eq("day_of_week", h.day_of_week);
    } else {
      // Upsert: delete existing then insert fresh (simpler than partial update)
      await supabase.from("availability_rules").delete().eq("day_of_week", h.day_of_week);
      await supabase.from("availability_rules").insert({
        day_of_week: h.day_of_week,
        start_time: h.opens_at,
        end_time: h.closes_at,
        is_active: true,
      });
    }
  }

  // Check if any confirmed/pending bookings fall outside the new hours
  // We look 30 days ahead for bookings on each day that changed
  const warnings: string[] = [];
  const now = new Date();
  for (const h of hours) {
    if (h.is_closed || !h.opens_at || !h.closes_at) continue;
    // Find bookings on this day_of_week that are outside the new window
    const opensMinutes = h.opens_at.split(":").reduce((acc, v, i) => acc + (i === 0 ? Number(v) * 60 : Number(v)), 0);
    const closesMinutes = h.closes_at.split(":").reduce((acc, v, i) => acc + (i === 0 ? Number(v) * 60 : Number(v)), 0);
    // Query upcoming bookings on this day_of_week
    const { data: upcomingBookings } = await supabase
      .from("bookings")
      .select("id, client_name, service_type, starts_at, ends_at")
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", now.toISOString());
    if (upcomingBookings) {
      for (const b of upcomingBookings) {
        const bStart = new Date(b.starts_at);
        if (bStart.getDay() !== h.day_of_week) continue;
        const bMins = bStart.getHours() * 60 + bStart.getMinutes();
        if (bMins < opensMinutes || bMins >= closesMinutes) {
          warnings.push(`${String(b.client_name)} — ${String(b.service_type)} at ${bStart.toLocaleString()} is outside the new hours.`);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, warnings });
}
