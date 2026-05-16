import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClientFormsTable } from "@/components/admin/ClientFormsTable";

export const dynamic = "force-dynamic";

export default async function ClientFormsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: forms } = await supabase
    ?.from("client_forms")
    .select("id, user_id, booking_id, form_type, service_category, service_name, submitted_at, fields, signature, signature2, reviewed, reviewed_at")
    .order("submitted_at", { ascending: false }) ?? { data: [] };

  return (
    <AdminShell title="Client Forms">
      <div style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--pink-dark)", fontWeight: 500, marginBottom: "0.3rem" }}>Admin</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 300, marginBottom: "0.4rem" }}>Client Forms</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--grey-mid)" }}>All submitted intake forms. Click a row to view answers, signatures, and export PDF.</p>
        </div>
        <ClientFormsTable forms={forms ?? []} />
      </div>
    </AdminShell>
  );
}
