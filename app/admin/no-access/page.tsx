import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminNoAccessPage() {
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
      }}>Restricted Area</p>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "2.4rem",
        fontWeight: 300,
        color: "var(--black)",
        marginBottom: "1rem",
        lineHeight: 1.2,
      }}>
        You do not have admin access
      </h1>

      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: "0.95rem",
        color: "var(--grey-mid)",
        maxWidth: 420,
        lineHeight: 1.7,
        marginBottom: "2rem",
      }}>
        This area is for studio staff only. If you believe you should have access,
        please contact the studio.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/account" className="btn btn-pink btn-sm" style={{ textDecoration: "none" }}>
          Go to My Account
        </Link>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
