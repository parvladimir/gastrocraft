import { getAbsoluteUrl, getSiteUrl, siteConfig } from "@/lib/site-config";

const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  description: siteConfig.description,
  name: siteConfig.name,
  url: getSiteUrl()
};

const websiteData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  description: siteConfig.description,
  inLanguage: siteConfig.language,
  name: siteConfig.name,
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: getSiteUrl()
  },
  url: getAbsoluteUrl("/")
};

const professionalServiceData = {
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
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd([
          organizationData,
          websiteData,
          professionalServiceData
        ])
      }}
    />
  );
}
