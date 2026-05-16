import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
export { formatDate, formatDateTime, fullName } from "@/lib/format";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "lillyansbeautystudio@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/admin");

  const { data: userData } = await auth.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login?next=/admin");

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { user, supabase: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const allowlisted = Boolean(user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  if (!allowlisted || profile?.role !== "admin" || profile?.is_admin !== true) redirect("/admin/access-denied");
  return { user, supabase };
}
