import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
export { formatDate, formatDateTime, fullName } from "@/lib/format";

export async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/admin/login");

  const { data: userData } = await auth.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/admin/login");

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { user, supabase: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin && profile?.role !== "admin") redirect("/admin/login");
  return { user, supabase };
}
