import { AdminShell } from "@/components/admin/AdminShell";
import { BlockedTimesManager } from "@/components/admin/ui/BlockedTimesManager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Block = { id: string; starts_at: string; ends_at: string; reason?: string | null };

export default async function BlockedTimesPage() {
  const { supabase } = await requireAdmin();
  let rows: Block[] = [];
  try {
    const res = await supabase?.from("blocked_times").select("id, starts_at, ends_at, reason").order("starts_at", { ascending: false }).limit(100);
    rows = (res?.data as Block[]) ?? [];
  } catch { rows = []; }

  return (
    <AdminShell title="Blocked Times" eyebrow="Schedule">
      <BlockedTimesManager blocks={rows} />
    </AdminShell>
  );
}
