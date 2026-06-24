import Link from "next/link";

export const dynamic = "force-dynamic";

// Standalone (does not call requireAdmin, so no redirect loop). Shown to a
// signed-in non-admin who hits /admin.
export default function AdminNoAccessPage() {
  return (
    <div className="lbs-admin">
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <p className="page-eyebrow" style={{ marginBottom: 12 }}>Restricted Area</p>
        <h1 className="page-title" style={{ fontSize: 34, marginBottom: 12 }}>You do not have admin access</h1>
        <p className="page-sub" style={{ maxWidth: 420, lineHeight: 1.7, marginBottom: 28 }}>
          This area is for studio staff only. If you believe you should have access, please contact the studio.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/account" className="btn btn-primary">Go to My Account</Link>
          <Link href="/" className="btn btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
