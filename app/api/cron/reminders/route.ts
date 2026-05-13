import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { notifyAdmin, notifyClient } from "@/lib/notifications";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const now = new Date();
  const in48 = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [appointments, intakesDue, completed, renewals] = await Promise.all([
    supabase.from("bookings").select("*").eq("status", "confirmed").gte("starts_at", now.toISOString()).lte("starts_at", in48),
    supabase.from("bookings").select("*").eq("status", "confirmed").gte("starts_at", now.toISOString()).lte("starts_at", in24),
    supabase.from("bookings").select("*").eq("status", "completed").gte("updated_at", yesterday),
    supabase.from("memberships").select("*").eq("status", "active").lte("renewal_date", in7)
  ]);

  let sent = 0;
  for (const booking of appointments.data || []) {
    await notifyClient(booking.email, "Appointment reminder", `Reminder: your ${booking.service_type} appointment is coming up.`);
    await supabase.from("automation_logs").insert({ automation_type: "appointment_reminder", target_table: "bookings", target_id: booking.id, recipient_email: booking.email });
    sent++;
  }
  for (const booking of intakesDue.data || []) {
    await notifyClient(booking.email, "Intake form reminder", "Please complete or update your intake form before your appointment.");
    await supabase.from("automation_logs").insert({ automation_type: "intake_reminder", target_table: "bookings", target_id: booking.id, recipient_email: booking.email });
    sent++;
  }
  for (const booking of completed.data || []) {
    await notifyClient(booking.email, "Thank you for visiting Lillyan's Beauty Studio", "Thank you for your appointment. Lilly would love your feedback when you have a moment.");
    await notifyClient(booking.email, "Review request", "If you loved your service, please consider leaving a review.");
    await supabase.from("automation_logs").insert({ automation_type: "followup_review_request", target_table: "bookings", target_id: booking.id, recipient_email: booking.email });
    sent++;
  }
  for (const membership of renewals.data || []) {
    await notifyClient(membership.email, "Membership renewal reminder", `Your ${membership.plan_name || "membership"} renewal is coming up.`);
    await supabase.from("automation_logs").insert({ automation_type: "membership_renewal", target_table: "memberships", target_id: membership.id, recipient_email: membership.email });
    sent++;
  }
  await notifyAdmin("Automation run complete", `${sent} reminder/follow-up emails queued.`);
  return NextResponse.json({ ok: true, sent });
}
