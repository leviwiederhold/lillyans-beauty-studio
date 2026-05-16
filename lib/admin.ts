import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
export { formatDate, formatDateTime, fullName } from "@/lib/format";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "lillyansbeautystudio@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

export async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/admin");

  const { data: userData } = await auth.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await auth
    .from("profiles")
    .select("role,is_admin,email")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminEmail(user.email) || profile?.role !== "admin" || profile?.is_admin !== true) {
    redirect("/admin/access-denied");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { user, supabase: null };

  return { user, supabase };
}
