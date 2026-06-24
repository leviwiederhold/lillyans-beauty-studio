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
    <AdminShell title="Business Hours" eyebrow="Business">
      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Weekly Schedule</span></div>
            <div className="card-body">
              <BusinessHoursEditor initialHours={byDay} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Booking Settings</span></div>
            <div className="card-body">
              <div className="f-row"><label className="f-label">Minimum booking notice</label><select className="f-input f-select" defaultValue="48 hours"><option>48 hours</option><option>24 hours</option><option>72 hours</option><option>1 week</option></select></div>
              <div className="f-row"><label className="f-label">Intake form expiration</label><select className="f-input f-select" defaultValue="6 months"><option>6 months</option><option>3 months</option><option>12 months</option><option>Never</option></select></div>
              <div className="f-row"><label className="f-label">Deposit amount</label><select className="f-input f-select" defaultValue="20% of service"><option>20% of service</option><option>Flat $50</option><option>Flat $100</option><option>No deposit</option></select></div>
              <div className="f-row"><label className="f-label">Payment processor</label><input className="f-input" value="Square" readOnly /></div>
              <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Cancellation window</label><select className="f-input f-select" defaultValue="24 hours"><option>24 hours</option><option>48 hours</option><option>72 hours</option></select></div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
