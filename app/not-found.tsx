import Link from "next/link";

export default function NotFound() {
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
      <Link
        href="/"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.4rem",
          fontWeight: 400,
          color: "var(--black)",
          textDecoration: "none",
          marginBottom: "2.5rem",
          display: "block",
          letterSpacing: "0.02em",
        }}
      >
        Lillyan&apos;s Beauty Studio
      </Link>

      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: "0.7rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--grey-light)",
        marginBottom: "1rem",
      }}>404 — Page Not Found</p>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "2.8rem",
        fontWeight: 300,
        color: "var(--black)",
        marginBottom: "1rem",
        lineHeight: 1.2,
      }}>
        This page doesn&apos;t exist
      </h1>

      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: "0.95rem",
        color: "var(--grey-mid)",
        maxWidth: 360,
        lineHeight: 1.7,
        marginBottom: "2rem",
      }}>
        The page you&apos;re looking for may have moved or the link might be incorrect.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn btn-pink btn-sm" style={{ textDecoration: "none" }}>
          Back to Home
        </Link>
        <Link href="/book" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          Book an Appointment
        </Link>
      </div>
    </div>
  );
}
