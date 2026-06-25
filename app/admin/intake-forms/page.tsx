import type { ComponentProps } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClientFormsTable } from "@/components/admin/ClientFormsTable";

export const dynamic = "force-dynamic";

export default async function IntakeFormsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  let forms: ComponentProps<typeof ClientFormsTable>["forms"] = [];
  try {
    const res = await supabase
      ?.from("client_forms")
      .select("id, user_id, booking_id, form_type, service_category, service_name, submitted_at, fields, signature, signature2, reviewed, reviewed_at")
      .order("submitted_at", { ascending: false });
    forms = (res?.data as ComponentProps<typeof ClientFormsTable>["forms"]) ?? [];
  } catch {
    forms = [];
  }

  return (
    <AdminShell title="Intake Forms" eyebrow="Records">
      <p className="page-sub" style={{ marginTop: -12, marginBottom: 16 }}>
        All submitted intake forms. Click a row to view answers, signatures, and export PDF.
      </p>
      <div className="card" style={{ padding: 4 }}>
        <ClientFormsTable forms={forms} />
      </div>
    </AdminShell>
  );
}
