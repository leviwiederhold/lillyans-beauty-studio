import { AdminShell } from "@/components/admin/AdminShell";
import { FilterPills, DataTable, StatusBadge, type Row } from "@/components/admin/ui/components";
import { BookingStatusControl } from "@/components/admin/ui/BookingStatusControl";
import { requireAdmin } from "@/lib/admin";
import { fullName, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Deposit due" },
  { value: "pending_admin_confirmation", label: "Needs confirm" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const active = params.filter || "all";

  let query = supabase
    ?.from("bookings")
    .select("*, clients(first_name,last_name,email,phone)")
    .order("starts_at", { ascending: false })
    .limit(200);
  if (active !== "all") query = query?.eq("status", active);
  let rows: Row[] = [];
  try { rows = ((await query)?.data as Row[]) ?? []; } catch { rows = []; }

  const columns = [
    {
      key: "client", label: "Client",
      render: (r: Row) => (
        <>
          <div className="dt-name">{(r.clients ? fullName(r.clients as Row) : "") || String(r.client_name || "Guest")}</div>
          <div className="dt-sub">{String((r.clients as Row)?.email || r.email || "")}</div>
        </>
      ),
    },
    { key: "service_type", label: "Service" },
    { key: "starts_at", label: "Date & Time", render: (r: Row) => formatDateTime(r.starts_at) },
    {
      key: "deposit_status", label: "Deposit",
      render: (r: Row) => {
        const d = String(r.deposit_status || "");
        if (d === "paid") return <StatusBadge status="paid" label="Paid" />;
        if (d === "waived") return <StatusBadge status="completed" label="Waived" />;
        return <StatusBadge status="pending" label="Due" />;
      },
    },
    {
      key: "status", label: "Status",
      render: (r: Row) => <BookingStatusControl id={String(r.id)} status={String(r.status || "")} />,
    },
  ];

  return (
    <AdminShell title="Bookings" eyebrow="Manage">
      <FilterPills options={FILTERS} active={active} basePath="/admin/bookings" />
      <DataTable columns={columns} rows={rows} empty="No bookings match this filter yet." />
    </AdminShell>
  );
}
