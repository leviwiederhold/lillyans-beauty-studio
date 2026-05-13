import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedding Makeup & Permanent Makeup Artist in the Greater Cincinnati Area | Lillyan's Beauty Studio",
  description:
    "Lillyan's Beauty Studio - certified wedding makeup artist and permanent makeup specialist serving the Greater Cincinnati Area.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.lillyansbeautystudio.com"),
  openGraph: {
    title: "Lillyan's Beauty Studio",
    description: "Wedding makeup, permanent makeup, facials, waxing, and beauty services in the Greater Cincinnati Area.",
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
