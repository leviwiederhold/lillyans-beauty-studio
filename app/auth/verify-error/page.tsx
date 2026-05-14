import Link from "next/link";
import { ResendVerificationForm } from "@/components/ResendVerificationForm";
import { getSafeNextPath } from "@/lib/auth/redirect";

export default async function VerifyErrorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = getSafeNextPath(typeof params.next === "string" ? params.next : null, "/book");
  const message = typeof params.message === "string" && params.message
    ? params.message
    : "This verification link is expired or already used. Request a new verification email.";

  return (
    <main className="auth-page">
      <header className="auth-header"><Link href="/" className="nav-logo">Lillyan&apos;s Beauty Studio<span>Cincinnati, Ohio</span></Link><Link href="/" className="auth-link">Back to Site</Link></header>
      <section className="auth-card">
        <p className="auth-eyebrow">Email Verification</p>
        <h1>Verification Link Expired</h1>
        <p className="auth-copy">{message}</p>
        <p className="auth-notice">Enter your email below and we&apos;ll send a fresh verification link.</p>
        <ResendVerificationForm nextPath={next} />
      </section>
    </main>
  );
}
