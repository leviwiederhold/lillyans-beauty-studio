"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-segment error boundary for the entire /admin area. Any error thrown while
// rendering an admin server component lands here instead of producing an opaque
// production "Server Components render" crash. The admin can retry or step out.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the real error in the browser console + server logs for diagnosis.
    console.error("[admin] render error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f3f4",
      padding: "2rem",
      textAlign: "center",
    }}>
      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: "0.7rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--grey-light)",
        marginBottom: "1rem",
      }}>Admin</p>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "2.2rem",
        fontWeight: 300,
        color: "var(--black)",
        marginBottom: "1rem",
        lineHeight: 1.2,
      }}>
        Something went wrong loading this page
      </h1>

      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: "0.95rem",
        color: "var(--grey-mid)",
        maxWidth: 460,
        lineHeight: 1.7,
        marginBottom: "0.5rem",
      }}>
        The dashboard hit an unexpected error. This is usually temporary — try again.
        If it persists, the database connection or a pending migration may need attention.
      </p>
      {error?.digest && (
        <p style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--grey-light)", marginBottom: "1.5rem" }}>
          Reference: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1rem" }}>
        <button onClick={reset} className="btn btn-pink btn-sm" style={{ cursor: "pointer" }}>
          Try Again
        </button>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
