import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { BusinessHoursEditor } from "@/components/admin/BusinessHoursEditor";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function BusinessHoursPage() {
  const { supabase } = await requireAdmin();
  const hoursRes = await supabase?.from("business_hours").select("*").order("day_of_week");
  const hours = hoursRes?.data || [];

  const byDay = DAYS.map((name, idx) => {
    const row = hours.find((h) => h.day_of_week === idx);
    return {
      day_of_week: idx,
      name,
      opens_at: row?.opens_at || "09:00",
      closes_at: row?.closes_at || "17:00",
      is_closed: row?.is_closed ?? (idx === 0 || idx === 6)
    };
  });

  return (
    <AdminShell title="Business Hours" eyebrow="Admin / Studio">
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header"><span className="card-title" style={{ fontSize: "1rem" }}>Weekly Hours</span></div>
        <div className="card-body">
          <BusinessHoursEditor initialHours={byDay} />
        </div>
      </div>
    </AdminShell>
  );
}
