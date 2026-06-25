import { AdminShell } from "@/components/admin/AdminShell";
import { HoursEditor } from "@/components/admin/ui/HoursEditor";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type AnyRow = Record<string, unknown>;

export default async function BusinessHoursPage() {
  const { supabase } = await requireAdmin();
  let hours: AnyRow[] = [];
  let settings: AnyRow | null = null;
  try {
    const [h, s] = await Promise.all([
      supabase?.from("business_hours").select("*").order("day_of_week"),
      supabase?.from("business_settings").select("booking_minimum_notice_hours, intake_expiration_months").eq("id", 1).maybeSingle(),
    ]);
    hours = (h?.data as AnyRow[]) ?? [];
    settings = (s?.data as AnyRow) ?? null;
  } catch { /* defensive: render defaults */ }

  const byDay = DAYS.map((name, idx) => {
    const row = hours.find((h) => h.day_of_week === idx);
    return {
      day_of_week: idx,
      name,
      opens_at: (row?.opens_at as string) || "09:00",
      closes_at: (row?.closes_at as string) || "17:00",
      is_closed: (row?.is_closed as boolean) ?? (idx === 0 || idx === 6),
    };
  });

  return (
    <AdminShell title="Business Hours" eyebrow="Business">
      <HoursEditor
        initialHours={byDay}
        minNoticeHours={Number(settings?.booking_minimum_notice_hours ?? 48)}
        intakeMonths={Number(settings?.intake_expiration_months ?? 6)}
      />
    </AdminShell>
  );
}
