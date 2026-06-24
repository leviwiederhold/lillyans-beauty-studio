import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, StatGrid, bookingColumns } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName, requireAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

function logQueryError(name: string, result: { error?: { message?: string } | null } | null | undefined) {
  if (result?.error) console.error(`[admin dashboard] ${name}: ${result.error.message || "Supabase query failed"}`);
}

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

  [
    ["today bookings", todayBookings],
    ["upcoming bookings", bookings],
    ["pending deposits", pendingDeposits],
    ["contact inquiries", contacts],
    ["intake forms", forms],
    ["clients", clients],
    ["memberships", memberships],
    ["gift card inquiries", giftCardInquiries]
  ].forEach(([name, result]) => logQueryError(String(name), result as { error?: { message?: string } | null } | null | undefined));

  const recentActivity = [
    ...(contacts?.data || []).map((r) => ({ type: "Contact", label: `${r.name} - ${r.subject}`, created_at: r.created_at })),
    ...(forms?.data || []).map((r) => ({ type: "Intake", label: `${fullName(r.clients)} - ${r.service_label}`, created_at: r.created_at })),
    ...(bookings?.data || []).map((r) => ({ type: "Booking", label: `${r.service_type} - ${r.status}`, created_at: r.created_at })),
    ...(giftCardInquiries?.data || []).map((r) => ({ type: "Gift Card", label: `${r.purchaser_name || "Gift card inquiry"} - ${r.status || "new"}`, created_at: r.created_at }))
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 10);

  return (
    <AdminShell title="Lillyan's Beauty Studio Admin">
      {!supabase && <p className="admin-card">Supabase is not configured. Add environment variables from .env.example.</p>}
      <StatGrid stats={[
        { label: "Today's Appointments", value: todayBookings?.data?.length || 0 },
        { label: "Upcoming Bookings", value: bookings?.data?.length || 0 },
        { label: "Pending Deposits", value: pendingDeposits?.data?.length || 0 },
        { label: "New Intake Forms", value: forms?.data?.length || 0 },
        { label: "Active Memberships", value: memberships?.count || 0 },
        { label: "Total Clients/Accounts", value: clients?.count || 0 }
      ]} />
      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Quick Actions</h2>
        </div>
        <div className="admin-controls">
          <Link href="/admin/calendar" className="btn btn-ghost btn-sm">Calendar</Link>
          <Link href="/admin/bookings" className="btn btn-ghost btn-sm">Bookings</Link>
          <Link href="/admin/clients" className="btn btn-ghost btn-sm">Client Search</Link>
          <Link href="/admin/services" className="btn btn-ghost btn-sm">Services</Link>
          <Link href="/admin/business-hours" className="btn btn-ghost btn-sm">Hours</Link>
          <Link href="/admin/gift-card-inquiries" className="btn btn-ghost btn-sm">Gift Cards</Link>
          <Link href="/admin/gallery" className="btn btn-ghost btn-sm">Gallery</Link>
          <Link href="/admin/settings" className="btn btn-ghost btn-sm">Settings</Link>
        </div>
      </section>
      <section className="admin-grid">
        <DataTable title="Today's Appointments" rows={todayBookings?.data || []} columns={bookingColumns} />
        <DataTable title="Upcoming Bookings" rows={bookings?.data || []} columns={bookingColumns} />
      </section>
      <section className="admin-grid">
        <DataTable title="Pending Deposits" rows={pendingDeposits?.data || []} columns={bookingColumns} />
        <DataTable title="New Contact Inquiries" rows={contacts?.data || []} columns={[
          { key: "name", label: "Name" },
          { key: "subject", label: "Subject" },
          { key: "deposit_required", label: "Deposit", render: (r) => r.deposit_required ? "Required" : "Waived" },
          { key: "created_at", label: "Received", render: (r) => formatDateTime(r.created_at) }
        ]} />
      </section>
      <section className="admin-grid">
        <DataTable title="Gift Card Inquiries" rows={giftCardInquiries?.data || []} columns={[
          { key: "purchaser_name", label: "Purchaser" },
          { key: "recipient_name", label: "Recipient" },
          { key: "amount_requested", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Received", render: (r) => formatDateTime(r.created_at) }
        ]} />
        <DataTable title="New Intake Forms" rows={forms?.data || []} columns={[
          { key: "client", label: "Client", render: (r) => fullName(r.clients) || r.email || "" },
          { key: "service_label", label: "Service" },
          { key: "signature", label: "Signature" },
          { key: "created_at", label: "Submitted", render: (r) => formatDateTime(r.created_at) }
        ]} />
      </section>
      <DataTable title="Recent Activity" rows={recentActivity} columns={[
        { key: "type", label: "Type" },
        { key: "label", label: "Activity" },
        { key: "created_at", label: "When", render: (r) => formatDateTime(r.created_at) }
      ]} />
    </AdminShell>
  );
}
