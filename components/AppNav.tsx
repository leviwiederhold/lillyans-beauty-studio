import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { AvatarDropdown } from "@/components/AvatarDropdown";

export async function AppNav() {
  const auth = await createSupabaseServerClient();
  let user = null;
  let isAdmin = false;
  let initials = "";

  if (auth) {
    const { data } = await auth.auth.getUser();
    user = data.user ?? null;
    if (user) {
      const supabase = createSupabaseAdminClient();
      const { data: profile } = await supabase
        ?.from("profiles")
        .select("role,is_admin,full_name")
        .eq("id", user.id)
        .maybeSingle() ?? { data: null };
      isAdmin = !!(profile?.is_admin || profile?.role === "admin");
      const name: string = profile?.full_name || user.email || "";
      initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p: string) => p[0].toUpperCase())
        .join("") || (user.email?.[0]?.toUpperCase() ?? "?");
    }
  }

  return (
    <nav className="app-nav">
      <Link href="/" className="app-nav-logo">
        Lillyan&apos;s Beauty Studio
        <span>Fayetteville, Ohio</span>
      </Link>
      <div className="app-nav-links">
        <Link href="/book" className="nav-link-app">Book</Link>
        <Link href="/memberships" className="nav-link-app">Memberships</Link>
        <Link href="/gift-cards" className="nav-link-app">Gift Cards</Link>
        <AvatarDropdown user={user} isAdmin={isAdmin} initials={initials} />
      </div>
    </nav>
  );
}
