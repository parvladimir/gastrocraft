import type {
  ContactType,
  DemoId,
  OfferStatus,
  RestaurantCategory,
  RestaurantStatus,
  SalesUser,
  ServicePackageTemplate
} from "@/lib/sales-types";

export const salesUsers: SalesUser[] = [
  {
    created_at: "2026-07-27T00:00:00.000Z",
    email: "andrii@dinevio.local",
    id: "andrii",
    name: "Andrii",
    password: "dinevio"
  },
  {
    created_at: "2026-07-27T00:00:00.000Z",
    email: "volodymyr@dinevio.local",
    id: "volodymyr",
    name: "Volodymyr",
    password: "dinevio"
  }
];

export const restaurantStatuses: RestaurantStatus[] = [
  "Neu",
  "Besuch geplant",
  "Nicht erreicht",
  "Besucht",
  "Interessiert",
  "Rückruf",
  "Demo gesendet",
  "Angebot gesendet",
  "Kunde gewonnen",
  "Abgelehnt"
];

export const restaurantCategories: RestaurantCategory[] = [
  "Imbiss",
  "Grill",
  "Pizzeria",
  "Restaurant",
  "Café",
  "Bäckerei",
  "Lieferdienst",
  "Bar",
  "Sonstiges"
];

export const contactTypes: ContactType[] = [
  "Anrufen",
  "WhatsApp",
  "Erneut besuchen",
  "Angebot senden",
  "E-Mail senden"
];

export const offerStatuses: OfferStatus[] = [
  "Entwurf",
  "Gesendet",
  "Angenommen",
  "Abgelehnt"
];

export const demoOptions: Record<
  DemoId,
  {
    label: string;
    url: string;
  }
> = {
  none: {
    label: "Noch nicht ausgewählt",
    url: ""
  },
  rhodosgrill: {
    label: "Rhodos Grill",
    url: "http://rhodosgrill.dinevio.de"
  },
  schlemmerhus: {
    label: "Schlemmerhus",
    url: "http://schlemmerhus.dinevio.de"
  },
  schnellundlecker: {
    label: "Schnell & Lecker",
    url: "http://schnellundlecker.dinevio.de"
  }
};

export const initialPackageTemplates: ServicePackageTemplate[] = [
  {
    description:
      "Moderne One-Page-Webseite, Speisekarte, Öffnungszeiten, Kontakt und Smartphone-Optimierung.",
    id: "starter",
    name: "Starter"
  },
  {
    description:
      "Mehrere Seiten, Galerie, Speisekarte, Google-Maps-Integration, Kontakt und Reservierung, individuelle Gestaltung.",
    id: "business",
    name: "Business"
  },
  {
    description:
      "Individueller Umfang, zusätzliche Funktionen und erweiterte Unterstützung.",
    id: "premium",
    name: "Premium"
  }
];

export const statusClassNames: Record<RestaurantStatus, string> = {
  Abgelehnt: "border-red-400/30 bg-red-500/12 text-red-200",
  "Angebot gesendet": "border-cyan-300/30 bg-cyan-400/12 text-cyan-100",
  "Besuch geplant": "border-blue-300/30 bg-blue-400/12 text-blue-100",
  Besucht: "border-violet-300/30 bg-violet-400/12 text-violet-100",
  "Demo gesendet": "border-sky-300/30 bg-sky-400/12 text-sky-100",
  Interessiert: "border-yellow-300/35 bg-yellow-400/12 text-yellow-100",
  "Kunde gewonnen": "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
  "Nicht erreicht": "border-slate-400/25 bg-slate-500/12 text-slate-200",
  Neu: "border-slate-400/25 bg-slate-500/12 text-slate-200",
  "Rückruf": "border-orange-300/35 bg-orange-400/12 text-orange-100"
};
