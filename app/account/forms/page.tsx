import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { FormsUpdateFlow } from "@/components/account/FormsUpdateFlow";

export const dynamic = "force-dynamic";

export default async function AccountFormsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account/forms");
  const { data } = await auth.auth.getUser();
  if (!data.user) redirect("/login?next=/account/forms");

  const initialCategory = searchParams.category ?? undefined;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f4" }}>
      <AppNav />
      <div className="app-page-wrap">
        <div className="app-page-inner" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="sec-label">My Account</p>
            <h1 className="sec-title">Update My Forms</h1>
            <p className="sec-sub">Update your intake forms any time your health information changes.</p>
          </div>
          <FormsUpdateFlow userId={data.user.id} initialCategory={initialCategory} />
        </div>
      </div>
    </div>
  );
}
