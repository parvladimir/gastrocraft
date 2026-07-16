import { getSiteUrl, siteConfig } from "@/lib/site-config";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  areaServed: "Deutschland",
  description: siteConfig.description,
  knowsAbout: [
    "Restaurant-Websites",
    "Digitale Speisekarten",
    "QR-Lösungen",
    "Google Business Optimierung",
    "Webdesign für Gastronomie"
  ],
  name: siteConfig.name,
  url: getSiteUrl()
};

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
    />
  );
}
