"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-segment error boundary for the entire /admin area. Any error thrown while
// rendering an admin server component is contained here (with a recoverable UI +
// logged digest) instead of producing an opaque production crash.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] render error:", error);
  }, [error]);

  return (
    <div className="lbs-admin">
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <p className="page-eyebrow" style={{ marginBottom: 12 }}>Admin</p>
        <h1 className="page-title" style={{ fontSize: 30, marginBottom: 12 }}>Something went wrong loading this page</h1>
        <p className="page-sub" style={{ maxWidth: 460, lineHeight: 1.7, marginBottom: 6 }}>
          The dashboard hit an unexpected error. This is usually temporary — try again. If it persists,
          the database connection or a pending migration may need attention.
        </p>
        {error?.digest && <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink3)", marginBottom: 20 }}>Reference: {error.digest}</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
          <button onClick={reset} className="btn btn-primary">Try Again</button>
          <Link href="/" className="btn btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
