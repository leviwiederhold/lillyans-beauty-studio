import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/AdminDataViews";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const { supabase } = await requireAdmin();
  const [audit, errors, automations] = await Promise.all([
    supabase?.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(100),
    supabase?.from("error_logs").select("*").order("created_at", { ascending: false }).limit(100),
    supabase?.from("automation_logs").select("*").order("created_at", { ascending: false }).limit(100)
  ]);
  return (
    <AdminShell title="Logs & Reliability" eyebrow="Admin / Logs">
      <div className="admin-card">
        <h2>Backup / Export Database Data</h2>
        <p className="admin-empty">Use CSV exports for operational backups. Full database backups should be enabled in Supabase project settings.</p>
        {["clients", "bookings", "intake_forms", "contact_inquiries", "memberships"].map((table) => <p key={table}><a className="admin-link-button" href={`/api/admin/export?table=${table}`}>Export {table}.csv</a></p>)}
      </div>
      <DataTable title="Admin Activity Log" rows={audit?.data || []} columns={[
        { key: "action", label: "Action" },
        { key: "table_name", label: "Table" },
        { key: "created_at", label: "When", render: (r) => formatDateTime(r.created_at) }
      ]} />
      <DataTable title="Automation Logs" rows={automations?.data || []} columns={[
        { key: "automation_type", label: "Automation" },
        { key: "recipient_email", label: "Recipient" },
        { key: "status", label: "Status" },
        { key: "created_at", label: "When", render: (r) => formatDateTime(r.created_at) }
      ]} />
      <DataTable title="Error Logs" rows={errors?.data || []} columns={[
        { key: "source", label: "Source" },
        { key: "message", label: "Message" },
        { key: "created_at", label: "When", render: (r) => formatDateTime(r.created_at) }
      ]} />
    </AdminShell>
  );
}
