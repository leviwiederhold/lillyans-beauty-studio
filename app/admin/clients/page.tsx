import { AdminShell } from "@/components/admin/AdminShell";
import { ClientsGrid } from "@/components/admin/ui/ClientsGrid";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;
async function safe<T>(q: PromiseLike<T> | undefined): Promise<AnyRow[]> {
  if (!q) return [];
  try { return (((await q) as { data?: AnyRow[] | null }).data) ?? []; } catch { return []; }
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireAdmin();
  const { q } = await searchParams;

  const [clients, bookings, forms, memberships] = await Promise.all([
    safe(supabase?.from("clients").select("*").order("updated_at", { ascending: false }).limit(300)),
    safe(supabase?.from("bookings").select("client_id")),
    safe(supabase?.from("client_forms").select("client_id")),
    safe(supabase?.from("memberships").select("client_id,status,plan_name").eq("status", "active")),
  ]);

  const rows = clients.map((c) => {
    const member = memberships.find((m) => m.client_id === c.id);
    return {
      id: String(c.id),
      first_name: c.first_name as string | null,
      last_name: c.last_name as string | null,
      email: c.email as string | null,
      phone: c.phone as string | null,
      created_at: c.created_at as string | null,
      booking_count: bookings.filter((b) => b.client_id === c.id).length,
      intake_count: forms.filter((f) => f.client_id === c.id).length,
      is_member: !!member,
      member_label: member ? `${String(member.plan_name || "Member")}` : undefined,
    };
  });

  return (
    <AdminShell title="Clients" eyebrow="Manage">
      <p className="page-sub" style={{ marginTop: -12, marginBottom: 16 }}>{rows.length} client{rows.length === 1 ? "" : "s"} total</p>
      <ClientsGrid clients={rows} initialQuery={q || ""} />
    </AdminShell>
  );
}
