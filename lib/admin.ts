import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, isAdminProfile } from "@/lib/auth-roles";
export { formatDate, formatDateTime, fullName } from "@/lib/format";

export async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/admin");

  const { data: userData } = await auth.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login?next=/admin");

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { user, supabase: null };

  const profile = await ensureProfileForUser(supabase, user);

  if (!isAdminProfile(profile)) redirect("/admin/access-denied");
  return { user, supabase };
}
