import Link from "next/link";

export default function AdminAccessDeniedPage() {
  return (
    <main className="admin-shell login-shell">
      <section className="admin-card login-card">
        <h1>Admin Access</h1>
        <p>You do not have admin access.</p>
        <p>Only approved Lillyan&apos;s Beauty Studio admin accounts can open the admin dashboard.</p>
        <Link className="btn-primary" href="/account">Go to Account</Link>
      </section>
    </main>
  );
}
