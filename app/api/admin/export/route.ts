import { requireAdmin } from "@/lib/admin";

const allowed = ["clients", "bookings", "intake_forms", "contact_inquiries", "memberships"] as const;

export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  const table = new URL(request.url).searchParams.get("table") || "clients";
  if (!supabase || !allowed.includes(table as any)) return new Response("Unsupported export", { status: 400 });
  const { data, error } = await supabase.from(table).select("*").limit(5000);
  if (error) return new Response(error.message, { status: 500 });
  const rows = data || [];
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => `"${String(typeof v === "object" && v !== null ? JSON.stringify(v) : v ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${table}.csv"`
    }
  });
}
