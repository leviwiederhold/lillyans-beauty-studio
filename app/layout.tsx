import type { Metadata } from "next";
import "./globals.css";
import "./admin-exact.css";

export const metadata: Metadata = {
  title: "Wedding Makeup & Permanent Makeup Artist in Cincinnati, Ohio | Lillyan's Beauty Studio",
  description:
    "Lillyan's Beauty Studio - certified wedding makeup artist and permanent makeup specialist serving Cincinnati, Ohio.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.lillyansbeautystudio.com"),
  openGraph: {
    title: "Lillyan's Beauty Studio",
    description: "Wedding makeup, permanent makeup, facials, waxing, and beauty services in Cincinnati, Ohio.",
    type: "website",
    locale: "en_US"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
