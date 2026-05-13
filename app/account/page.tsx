import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { DataTable, bookingColumns, membershipColumns } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName } from "@/lib/format";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/account/login");
  const { data } = await auth.auth.getUser();
  if (!data.user?.email) redirect("/account/login");

  const supabase = createSupabaseAdminClient();
  const [clientRes] = await Promise.all([
    supabase?.from("clients").select("*").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle()
  ]);
  const client = clientRes?.data;
  const [forms, bookings, memberships, codes] = await Promise.all([
    client ? supabase?.from("intake_forms").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null,
    client ? supabase?.from("bookings").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null,
    client ? supabase?.from("memberships").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null,
    client ? supabase?.from("gift_card_code_redemptions").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null
  ]);

  return (
    <main className="admin-shell">
      <div className="admin-header"><div><p className="section-label">Client Account</p><h1>{client ? fullName(client) || "Your Profile" : "Your Profile"}</h1></div><Link href="/" className="btn-outline">View Site</Link></div>
      <ClientProfileForm client={client || { email: data.user.email }} />
      <DataTable title="Saved Intake Forms" rows={forms?.data || []} columns={[
        { key: "service_label", label: "Service" },
        { key: "created_at", label: "Submitted", render: (r) => formatDateTime(r.created_at) },
        { key: "signature", label: "Signature" }
      ]} />
      <DataTable title="Booking / Request History" rows={bookings?.data || []} columns={bookingColumns} />
      <DataTable title="Membership Status" rows={memberships?.data || []} columns={membershipColumns} />
      <DataTable title="Gift Card / Code History" rows={codes?.data || []} columns={[
        { key: "code", label: "Code" },
        { key: "status", label: "Status" },
        { key: "created_at", label: "Used", render: (r) => formatDateTime(r.created_at) }
      ]} />
    </main>
  );
}
