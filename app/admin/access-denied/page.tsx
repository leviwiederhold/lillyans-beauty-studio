import Link from "next/link";

export default function AdminAccessDeniedPage() {
  return (
    <main className="admin-shell login-shell">
      <section className="admin-card login-card">
        <p className="sec-label">Admin</p>
        <h1>No Admin Access</h1>
        <p>You do not have admin access.</p>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link href="/" className="btn-outline">Back to Site</Link>
          <Link href="/login?next=/admin" className="btn-primary">Sign In</Link>
        </div>
      </section>
    </main>
  );
}
