import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function logError(source: string, error: unknown, details?: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("error_logs").insert({
    source,
    message: error instanceof Error ? error.message : String(error),
    details: details || null
  });
}

export async function audit(adminUserId: string | null, action: string, tableName: string, recordId?: string | null, beforeData?: unknown, afterData?: unknown) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    table_name: tableName,
    record_id: recordId || null,
    before_data: beforeData || null,
    after_data: afterData || null
  });
}
