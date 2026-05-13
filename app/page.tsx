import { LandingPage } from "@/components/LandingPage";

export default function Home() {
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
              "Certified wedding makeup artist and permanent makeup specialist serving the Greater Cincinnati Area.",
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
