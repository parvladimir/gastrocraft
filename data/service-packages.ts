export type ServicePackage = {
  badge?: string;
  ctaHref: string;
  ctaLabel: string;
  description: string;
  featured: boolean;
  features: string[];
  id: string;
  name: string;
  price: string;
  suffix: string;
};

export const servicePackages: ServicePackage[] = [
  {
    ctaHref: "#contact",
    ctaLabel: "Starter anfragen",
    description:
      "Für kleine Betriebe, die schnell mit einer professionellen digitalen Speisekarte starten möchten.",
    featured: false,
    features: [
      "Digitale Speisekarte",
      "QR-Code für Tische und Flyer",
      "Öffnungszeiten und Kontaktdaten",
      "Telefon- und Routen-Button",
      "Mobile Optimierung"
    ],
    id: "starter",
    name: "Starter",
    price: "ab 149 €",
    suffix: "einmalig"
  },
  {
    badge: "Empfohlen",
    ctaHref: "#contact",
    ctaLabel: "Kostenlose Demo anfragen",
    description:
      "Der vollständige Online-Auftritt für Restaurants, Cafés und Imbisse.",
    featured: true,
    features: [
      "Moderne Restaurant-Website",
      "Digitale Speisekarte",
      "Bildergalerie",
      "Google Maps",
      "WhatsApp-Integration",
      "Kontakt- oder Reservierungsformular",
      "Basis-SEO",
      "Mobile Optimierung"
    ],
    id: "professional",
    name: "Professional",
    price: "ab 399 €",
    suffix: "einmalig"
  },
  {
    ctaHref: "#contact",
    ctaLabel: "Signature anfragen",
    description:
      "Für Betriebe, die ihre gesamte digitale Präsenz professionell aufstellen möchten.",
    featured: false,
    features: [
      "Alles aus Professional",
      "Google Business Optimierung",
      "Erweiterte lokale SEO",
      "Mehrsprachige Inhalte",
      "Aktionen und Angebotsbereiche",
      "Individuelle Designanpassung",
      "30 Tage technische Betreuung"
    ],
    id: "signature",
    name: "Signature",
    price: "ab 699 €",
    suffix: "einmalig"
  }
];

export const monthlySupport = {
  ctaHref: "#contact",
  ctaLabel: "Betreuung anfragen",
  description:
    "Wir halten Ihre Website, Speisekarte und wichtigen Informationen dauerhaft aktuell.",
  features: [
    "Preise und Speisekarte aktualisieren",
    "Öffnungszeiten ändern",
    "Bilder und Texte austauschen",
    "Aktionen einpflegen",
    "Technische Kontrolle",
    "Kleine Google-Business-Anpassungen"
  ],
  note: "Monatlich kündbar. Umfang nach Vereinbarung.",
  price: "ab 49 € / Monat",
  title: "Laufende Betreuung"
};
