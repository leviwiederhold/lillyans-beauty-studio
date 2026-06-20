import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, StatGrid, bookingColumns } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName, requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/bookings", label: "All Bookings" },
  { href: "/admin/clients", label: "Client Search" },
  { href: "/admin/client-forms", label: "Intake Forms" },
  { href: "/admin/memberships", label: "Memberships" },
  { href: "/admin/services", label: "Services & Pricing" },
  { href: "/admin/business-hours", label: "Business Hours" },
  { href: "/admin/blocked-times", label: "Blocked Times" },
  { href: "/admin/gift-card-inquiries", label: "Gift Card Inquiries" },
  { href: "/admin/gift-card-codes", label: "Gift Card Codes" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/settings", label: "Settings" },
];

// Runs a Supabase query thenable and never rejects. If Supabase is unreachable
// (e.g. paused / over quota) the underlying fetch rejects — we swallow it and
// return a safe empty result so the dashboard renders instead of crashing.
async function safe<T>(q: PromiseLike<T> | undefined): Promise<{ data: unknown[]; count: number }> {
  if (!q) return { data: [], count: 0 };
  try {
    const res = (await q) as { data?: unknown[] | null; count?: number | null };
    return { data: res?.data ?? [], count: res?.count ?? 0 };
  } catch (e) {
    console.error("[admin] dashboard query failed:", e);
    return { data: [], count: 0 };
  }
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const today = new Date().toISOString();

  // allSettled + per-query try/catch: an unconfigured client, an empty database,
  // or a single failing/rejecting query never crashes the dashboard.
  const [bookings, deposits, giftInquiries, forms, clients, memberships] = await Promise.all([
    safe(supabase?.from("bookings").select("*, clients(first_name,last_name,email,phone)").gte("starts_at", today).order("starts_at").limit(8)),
    safe(supabase?.from("bookings").select("id, client_name, service_type, starts_at, deposit_amount, deposit_status")
      .eq("deposit_required", true).in("deposit_status", ["pending", "payment_link_sent", "payment_link_pending"]).order("starts_at").limit(8)),
    safe(supabase?.from("contact_inquiries").select("*").eq("subject", "gift_card_inquiry").order("created_at", { ascending: false }).limit(8)),
    safe(supabase?.from("client_forms").select("id, form_type, service_name, service_category, submitted_at, reviewed, clients:client_id(first_name,last_name,email)").order("submitted_at", { ascending: false }).limit(8)),
    safe(supabase?.from("clients").select("id", { count: "exact", head: true })),
    safe(supabase?.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active")),
  ]);

  return (
    <AdminShell title="Lillyan's Beauty Studio Admin">
      {!supabase && <p className="admin-card">Supabase is not configured. Add environment variables from .env.example.</p>}

      <StatGrid stats={[
        { label: "Upcoming Bookings", value: bookings.data.length },
        { label: "Pending Deposits", value: deposits.data.length },
        { label: "New Intake Forms", value: forms.data.length },
        { label: "Active Memberships", value: memberships.count },
        { label: "Total Clients", value: clients.count },
      ]} />

      {/* Quick navigation to every operations area */}
      <div className="admin-card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-app-outline btn-sm" style={{ textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="admin-grid">
        <DataTable title="Upcoming Bookings" rows={bookings.data as Record<string, unknown>[]} columns={bookingColumns} />
        <DataTable title="Pending Deposits" rows={deposits.data as Record<string, unknown>[]} columns={[
          { key: "client_name", label: "Client" },
          { key: "service_type", label: "Service" },
          { key: "starts_at", label: "When", render: (r) => formatDateTime(r.starts_at) },
          { key: "deposit_status", label: "Deposit", render: (r) => String(r.deposit_status ?? "—").replace(/_/g, " ") },
        ]} />
      </section>

      <section className="admin-grid">
        <DataTable title="New Intake Forms" rows={forms.data as Record<string, unknown>[]} columns={[
          { key: "client", label: "Client", render: (r) => fullName(r.clients as Record<string, unknown> | null) || "—" },
          { key: "form_type", label: "Form", render: (r) => String(r.form_type ?? "").replace(/_/g, " ") },
          { key: "service_name", label: "Service", render: (r) => String(r.service_name ?? r.service_category ?? "—") },
          { key: "reviewed", label: "Status", render: (r) => (r.reviewed ? "Reviewed" : "New") },
          { key: "submitted_at", label: "Submitted", render: (r) => formatDateTime(r.submitted_at) },
        ]} />
        <DataTable title="Gift Card Inquiries" rows={giftInquiries.data as Record<string, unknown>[]} columns={[
          { key: "name", label: "Name" },
          { key: "occasion", label: "Occasion", render: (r) => String(r.occasion ?? "—") },
          { key: "email", label: "Email" },
          { key: "created_at", label: "Received", render: (r) => formatDateTime(r.created_at) },
        ]} />
      </section>
    </AdminShell>
  );
}
