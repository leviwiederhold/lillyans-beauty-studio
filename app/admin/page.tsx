import { AdminShell } from "@/components/admin/AdminShell";
import { AppointmentList, StatGrid, StatusBadge } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName, requireAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [todayBookings, bookings, pendingDeposits, contacts, forms, clients, memberships, giftCardInquiries] = await Promise.all([
    supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").gte("starts_at", todayStart.toISOString()).lte("starts_at", todayEnd.toISOString()).order("starts_at").limit(8),
    supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").gte("starts_at", now.toISOString()).order("starts_at").limit(8),
    supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").eq("deposit_required", true).neq("deposit_status", "paid").order("created_at", { ascending: false }).limit(8),
    supabase?.from("contact_inquiries").select("*").order("created_at", { ascending: false }).limit(8),
    supabase?.from("intake_forms").select("*, clients(first_name,last_name,email,phone)").order("created_at", { ascending: false }).limit(8),
    supabase?.from("clients").select("id", { count: "exact", head: true }),
    supabase?.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase?.from("gift_card_inquiries").select("*").order("created_at", { ascending: false }).limit(8)
  ]);

  const recentActivity = [
    ...(contacts?.data || []).map((r) => ({ type: "Contact", label: `${r.name} - ${r.subject}`, created_at: r.created_at })),
    ...(forms?.data || []).map((r) => ({ type: "Intake", label: `${fullName(r.clients)} - ${r.service_label}`, created_at: r.created_at })),
    ...(bookings?.data || []).map((r) => ({ type: "Booking", label: `${r.service_type} - ${r.status}`, created_at: r.created_at })),
    ...(giftCardInquiries?.data || []).map((r) => ({ type: "Gift Card", label: `${r.purchaser_name || "Gift card inquiry"} - ${r.status || "new"}`, created_at: r.created_at }))
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 10);
  const attention = [
    ...(pendingDeposits?.data || []).slice(0, 3).map((r) => ({ label: `${r.client_name || fullName(r.clients) || "Client"} - deposit not received`, sub: r.service_type || "Booking", status: "pending" })),
    ...(forms?.data || []).slice(0, 2).map((r) => ({ label: `${fullName(r.clients) || "Client"} - intake form submitted`, sub: r.service_label || r.type, status: "review" })),
    ...(giftCardInquiries?.data || []).slice(0, 2).map((r) => ({ label: `Gift card inquiry - ${r.purchaser_name || "New"}`, sub: r.occasion || "Received", status: "new" }))
  ].slice(0, 4);
  const todayLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <AdminShell title="Overview">
      {!supabase && <p className="admin-card">Supabase is not configured. Add environment variables from .env.example.</p>}
      <div className="page-hdr">
        <div className="page-eyebrow">{todayLabel}</div>
        <div className="page-title">Good morning, <em>Lilly</em></div>
        <div className="page-sub">You have {todayBookings?.data?.length || 0} appointments today and {attention.length} items needing attention.</div>
      </div>
      <StatGrid stats={[
        { label: "Today's appointments", value: todayBookings?.data?.length || 0 },
        { label: "Pending deposits", value: pendingDeposits?.data?.length || 0 },
        { label: "Active Memberships", value: memberships?.count || 0 },
        { label: "Forms needing review", value: forms?.data?.length || 0 }
      ]} />
      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AppointmentList title="Today's Schedule" rows={todayBookings?.data || []} actionHref="/admin/calendar" />
          <AppointmentList title="Upcoming This Week" rows={bookings?.data || []} actionHref="/admin/bookings" />
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Recent Activity</span></div>
            <div className="card-body">
              {recentActivity.length === 0 ? <div className="empty-state"><i className="ti ti-sparkles" /><div className="empty-title">No recent activity</div><div className="empty-sub">New bookings, forms, and inquiries will appear here.</div></div> : recentActivity.map((item, index) => (
                <div className="appt-row" key={`${item.type}-${index}`}>
                  <div className="appt-dot new" />
                  <div className="appt-info"><div className="appt-name">{item.label}</div><div className="appt-svc">{item.type} · {formatDateTime(item.created_at)}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Quick Actions</span></div>
            <div className="card-body">
              <div className="qa-grid">
                <Link className="qa-btn" href="/admin/bookings"><i className="ti ti-calendar-plus" />Add booking</Link>
                <Link className="qa-btn" href="/admin/clients"><i className="ti ti-user-plus" />Add client</Link>
                <Link className="qa-btn" href="/admin/blocked-times"><i className="ti ti-ban" />Block time</Link>
                <Link className="qa-btn" href="/admin/business-hours"><i className="ti ti-clock" />Edit hours</Link>
                <Link className="qa-btn" href="/admin/services"><i className="ti ti-plus" />Add service</Link>
                <Link className="qa-btn" href="/admin/gift-cards"><i className="ti ti-gift" />Gift cards</Link>
              </div>
            </div>
          </div>
          <CalendarPreview bookings={bookings?.data || []} />
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Needs Attention</span></div>
            <div className="card-body" style={{ padding: "8px 16px" }}>
              {attention.length === 0 ? <div className="empty-state"><i className="ti ti-circle-check" /><div className="empty-title">Nothing needs attention</div><div className="empty-sub">You are caught up.</div></div> : attention.map((item, index) => (
                <div className="appt-row" key={`${item.label}-${index}`}>
                  <div className="appt-dot pending" />
                  <div className="appt-info"><div className="appt-name">{item.label}</div><div className="appt-svc">{item.sub}</div></div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">Business Snapshot</span></div>
            <div className="card-body">
              <div className="appt-row"><div className="appt-dot confirmed" /><div className="appt-info"><div className="appt-name">{clients?.count || 0} total clients/accounts</div><div className="appt-svc">Client records in Supabase</div></div></div>
              <div className="appt-row"><div className="appt-dot new" /><div className="appt-info"><div className="appt-name">{contacts?.data?.length || 0} new contact inquiries</div><div className="appt-svc">Latest website messages</div></div></div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function CalendarPreview({ bookings }: { bookings: any[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const bookingDays = new Set(bookings.map((b) => b.starts_at ? new Date(b.starts_at).getDate() : null).filter(Boolean));
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="card">
      <div className="card-hdr"><span className="card-hdr-title">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span></div>
      <div className="card-body" style={{ padding: "8px 12px" }}>
        <div className="mini-cal"><div className="mini-cal-grid">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div className="mini-cal-dh" key={d}>{d}</div>)}
          {cells.map((day, index) => day ? <div className={`mini-cal-d${day === now.getDate() ? " today" : ""}${bookingDays.has(day) ? " has-appt" : ""}`} key={index}>{day}</div> : <div className="mini-cal-d other" key={index} />)}
        </div></div>
      </div>
    </div>
  );
}
