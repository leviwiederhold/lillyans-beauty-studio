import { LandingPage } from "@/components/LandingPage";
import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/redirect";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const errorCode = typeof params.error_code === "string" ? params.error_code : typeof params.error === "string" ? params.error : "";
  if (errorCode) {
    const next = getSafeNextPath(typeof params.next === "string" ? params.next : null, "/book");
    const description = typeof params.error_description === "string" ? params.error_description : errorCode;
    redirect(`/auth/verify-error?next=${encodeURIComponent(next)}&code=${encodeURIComponent(errorCode)}&message=${encodeURIComponent(getAuthErrorMessage({ code: errorCode, message: description }))}`);
  }

  return (
    <>
      <LandingPage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: "Lillyan's Beauty Studio",
            url: "https://www.lillyansbeautystudio.com",
            telephone: "513-687-4317",
            email: "lillyansbeautystudio@gmail.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "152 W Pike St",
              addressLocality: "Fayetteville",
              addressRegion: "OH",
              postalCode: "45118",
              addressCountry: "US"
            },
            description:
              "Certified wedding makeup artist and permanent makeup specialist serving Cincinnati, Ohio.",
            sameAs: [
              "https://www.instagram.com/lillyans_beautystudio/",
              "https://www.facebook.com/lillyansbeautystudio"
            ]
          })
        }}
      />
    </>
  );
}
