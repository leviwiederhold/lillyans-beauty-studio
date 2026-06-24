import { AdminShell } from "@/components/admin/AdminShell";
import { SearchableClients } from "@/components/admin/AdminInteractiveViews";
import { requireAdmin } from "@/lib/admin";
import { OwnerTools } from "@/components/admin/OwnerTools";
import { DataTable } from "@/components/admin/AdminDataViews";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { supabase } = await requireAdmin();
  const [clients, forms, bookings, memberships] = await Promise.all([
    supabase?.from("clients").select("*").order("updated_at", { ascending: false }).limit(300),
    supabase?.from("intake_forms").select("client_id,type,service_label"),
    supabase?.from("bookings").select("client_id,service_type,status"),
    supabase?.from("memberships").select("client_id,status,plan_name")
  ]);

  const rows = (clients?.data || []).map((client) => {
    const clientForms = (forms?.data || []).filter((f) => f.client_id === client.id);
    const clientBookings = (bookings?.data || []).filter((b) => b.client_id === client.id);
    const membership = (memberships?.data || []).find((m) => m.client_id === client.id);
    return {
      ...client,
      services_used: Array.from(new Set([...clientForms.map((f) => f.service_label), ...clientBookings.map((b) => b.service_type)].filter(Boolean))),
      intake_count: clientForms.length,
      booking_count: clientBookings.length,
      membership_status: membership ? `${membership.plan_name || "Membership"} (${membership.status})` : client.membership_status || ""
    };
  });
  const duplicatePairs = rows.flatMap((client, index) => rows.slice(index + 1).filter((other) => (client.email && other.email && client.email.toLowerCase() === other.email.toLowerCase()) || (client.phone && other.phone && client.phone === other.phone)).map((duplicate) => ({ primary: client, duplicate })));
  const timeline = [
    ...(forms?.data || []).map((f) => ({ type: "Intake", client_id: f.client_id, label: f.service_label, created_at: new Date().toISOString() })),
    ...(bookings?.data || []).map((b) => ({ type: "Booking", client_id: b.client_id, label: `${b.service_type} - ${b.status}`, created_at: new Date().toISOString() })),
    ...(memberships?.data || []).map((m) => ({ type: "Membership", client_id: m.client_id, label: `${m.plan_name} - ${m.status}`, created_at: new Date().toISOString() }))
  ];

  return (
    <AdminShell title="Clients & Accounts" eyebrow="Admin / Clients">
      <OwnerTools duplicatePairs={duplicatePairs} />
      <SearchableClients clients={rows} />
      <DataTable title="Client Activity Timeline" rows={timeline} columns={[
        { key: "type", label: "Type" },
        { key: "label", label: "Activity" },
        { key: "created_at", label: "When", render: (r) => formatDateTime(r.created_at) }
      ]} />
    </AdminShell>
  );
}
