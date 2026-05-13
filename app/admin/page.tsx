import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, StatGrid, bookingColumns } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName, requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const today = new Date().toISOString();

  const [bookings, contacts, forms, clients, memberships] = await Promise.all([
    supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").gte("starts_at", today).order("starts_at").limit(8),
    supabase?.from("contact_inquiries").select("*").order("created_at", { ascending: false }).limit(8),
    supabase?.from("intake_forms").select("*, clients(first_name,last_name,email,phone)").order("created_at", { ascending: false }).limit(8),
    supabase?.from("clients").select("id", { count: "exact", head: true }),
    supabase?.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active")
  ]);

  const recentActivity = [
    ...(contacts?.data || []).map((r) => ({ type: "Contact", label: `${r.name} - ${r.subject}`, created_at: r.created_at })),
    ...(forms?.data || []).map((r) => ({ type: "Intake", label: `${fullName(r.clients)} - ${r.service_label}`, created_at: r.created_at })),
    ...(bookings?.data || []).map((r) => ({ type: "Booking", label: `${r.service_type} - ${r.status}`, created_at: r.created_at }))
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 10);

  return (
    <AdminShell title="Lillyan's Beauty Studio Admin">
      {!supabase && <p className="admin-card">Supabase is not configured. Add environment variables from .env.example.</p>}
      <StatGrid stats={[
        { label: "Upcoming Bookings", value: bookings?.data?.length || 0 },
        { label: "New Contact Inquiries", value: contacts?.data?.length || 0 },
        { label: "New Intake Forms", value: forms?.data?.length || 0 },
        { label: "Active Memberships", value: memberships?.count || 0 },
        { label: "Total Clients/Accounts", value: clients?.count || 0 }
      ]} />
      <section className="admin-grid">
        <DataTable title="Upcoming Bookings" rows={bookings?.data || []} columns={bookingColumns} />
        <DataTable title="New Contact Inquiries" rows={contacts?.data || []} columns={[
          { key: "name", label: "Name" },
          { key: "subject", label: "Subject" },
          { key: "deposit_required", label: "Deposit", render: (r) => r.deposit_required ? "Required" : "Waived" },
          { key: "created_at", label: "Received", render: (r) => formatDateTime(r.created_at) }
        ]} />
      </section>
      <DataTable title="New Intake Forms" rows={forms?.data || []} columns={[
        { key: "client", label: "Client", render: (r) => fullName(r.clients) },
        { key: "service_label", label: "Service" },
        { key: "signature", label: "Signature" },
        { key: "created_at", label: "Submitted", render: (r) => formatDateTime(r.created_at) }
      ]} />
      <DataTable title="Recent Activity" rows={recentActivity} columns={[
        { key: "type", label: "Type" },
        { key: "label", label: "Activity" },
        { key: "created_at", label: "When", render: (r) => formatDateTime(r.created_at) }
      ]} />
    </AdminShell>
  );
}
