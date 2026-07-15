import type { LucideIcon } from "lucide-react";
import {
  LifeBuoy,
  Monitor,
  Rocket,
  ShieldCheck,
  Store,
  Users
} from "lucide-react";

export type CompanyBenefit = {
  description: string;
  icon: LucideIcon;
  number: string;
  title: string;
};

export const companyBenefits: CompanyBenefit[] = [
  {
    description:
      "Direkter Kontakt statt Ticketsystem. Kurze Wege und schnelle Entscheidungen.",
    icon: Users,
    number: "01",
    title: "Persönliche Zusammenarbeit"
  },
  {
    description:
      "Keine universellen Templates. Jedes Projekt wird speziell auf Gastronomiebetriebe abgestimmt.",
    icon: Store,
    number: "02",
    title: "Für Gastronomie entwickelt"
  },
  {
    description:
      "Ein hochwertiger digitaler Auftritt, der Vertrauen schafft und auf allen Geräten überzeugt.",
    icon: Monitor,
    number: "03",
    title: "Modernes Design"
  },
  {
    description:
      "Vom ersten Gespräch bis zur fertigen Website in kurzer Zeit.",
    icon: Rocket,
    number: "04",
    title: "Schnelle Umsetzung"
  },
  {
    description:
      "Auch nach dem Projekt bleiben wir Ihr Ansprechpartner.",
    icon: LifeBuoy,
    number: "05",
    title: "Laufende Betreuung"
  },
  {
    description:
      "Klare Preise. Keine versteckten Kosten. Keine Überraschungen.",
    icon: ShieldCheck,
    number: "06",
    title: "Transparent"
  }
];
