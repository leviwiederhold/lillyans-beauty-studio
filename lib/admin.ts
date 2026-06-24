import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
export { formatDate, formatDateTime, fullName } from "@/lib/format";

export async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  // Not signed in (or auth not configured) → log in, then return to /admin.
  if (!auth) redirect("/login?next=/admin");

  // getUser() is a network call; if Supabase is unreachable (paused/over quota)
  // it can throw. Treat any failure as "not signed in" rather than crashing.
  let user;
  try {
    const { data: userData } = await auth.auth.getUser();
    user = userData.user;
  } catch {
    redirect("/login?next=/admin");
  }
  if (!user) redirect("/login?next=/admin");

  const supabase = createSupabaseAdminClient();
  // Without the service-role client we cannot verify the role — fail closed.
  if (!supabase) redirect("/admin/no-access");

  // Verify admin role server-side. A query failure must not crash the page.
  let isAdmin = false;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!(profile?.is_admin || profile?.role === "admin");
  } catch {
    isAdmin = false;
  }
  if (!isAdmin) redirect("/admin/no-access");

  return { user, supabase };
}
