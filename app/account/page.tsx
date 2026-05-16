import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { DataTable, bookingColumns, membershipColumns } from "@/components/admin/AdminDataViews";
import { formatDateTime, fullName } from "@/lib/format";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";
import { MedicalFormEditor } from "@/components/client/MedicalFormEditor";
import { BookingActions } from "@/components/client/BookingActions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/account");
  const { data } = await auth.auth.getUser();
  if (!data.user?.email) redirect("/login?next=/account");

  const supabase = createSupabaseAdminClient();
  const clientRes = await supabase?.from("clients").select("*").or(`profile_id.eq.${data.user.id},email.ilike.${data.user.email}`).limit(1).maybeSingle();
  const client = clientRes?.data;
  const [forms, bookings, memberships, codes] = await Promise.all([
    client ? supabase?.from("intake_forms").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null,
    client ? supabase?.from("bookings").select("*").eq("client_id", client.id).order("starts_at", { ascending: false }) : null,
    client ? supabase?.from("memberships").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null,
    client ? supabase?.from("gift_card_code_redemptions").select("*").eq("client_id", client.id).order("created_at", { ascending: false }) : null
  ]);
  const now = Date.now();
  const bookingRows = bookings?.data || [];
  const upcoming = bookingRows.filter((booking) => booking.starts_at && new Date(booking.starts_at).getTime() >= now);
  const history = bookingRows.filter((booking) => !booking.starts_at || new Date(booking.starts_at).getTime() < now);

  return (
    <main className="admin-shell account-portal">
      <div className="admin-header">
        <div><p className="section-label">Client Account</p><h1>{client ? fullName(client) || "Your Profile" : "Your Profile"}</h1></div>
        <Link href="/" className="btn-outline">View Site</Link>
      </div>
      <nav className="account-tabs" aria-label="Account sections">
        <a href="#profile">Profile</a>
        <a href="#bookings">Bookings</a>
        <a href="#medical-forms">Medical Forms</a>
        <a href="#membership">Membership</a>
        <a href="#gift-cards">Gift Cards / Codes</a>
        <a href="#settings">Settings</a>
      </nav>

      <section id="profile"><ClientProfileForm client={client || { email: data.user.email }} /></section>

      <section className="admin-card" id="bookings">
        <h2>Upcoming Bookings</h2>
        <DataTable rows={upcoming} columns={[...bookingColumns, { key: "actions", label: "Actions", render: (row) => <BookingActions booking={row} /> }]} />
      </section>

      <DataTable title="Booking History" rows={history} columns={bookingColumns} />
      <MedicalFormEditor client={client || { email: data.user.email }} />
      <DataTable title="Previous Intake Forms" rows={forms?.data || []} columns={[
        { key: "service_label", label: "Service" },
        { key: "created_at", label: "Submitted", render: (row) => formatDateTime(row.created_at) },
        { key: "last_reviewed_at", label: "Reviewed", render: (row) => formatDateTime(row.last_reviewed_at) },
        { key: "is_default", label: "Default", render: (row) => row.is_default ? "Yes" : "" }
      ]} />

      <section id="membership">
        <DataTable title="Membership" rows={memberships?.data || []} columns={membershipColumns} />
        <p className="admin-empty"><Link href="/memberships" className="btn-outline">Manage Membership</Link></p>
      </section>

      <DataTable title="Gift Cards / Codes" rows={codes?.data || []} columns={[
        { key: "code", label: "Code" },
        { key: "status", label: "Status" },
        { key: "created_at", label: "Used", render: (row) => formatDateTime(row.created_at) }
      ]} />

      <section className="admin-card" id="settings">
        <h2>Settings</h2>
        <p className="admin-empty">Account email and password settings are managed through Supabase Auth. Contact the studio if you need help changing login credentials.</p>
      </section>
    </main>
  );
}
