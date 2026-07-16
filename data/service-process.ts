import type { LucideIcon } from "lucide-react";
import { Code2, LifeBuoy, PanelsTopLeft, SearchCheck } from "lucide-react";

export type ServiceProcessStage = {
  description: string;
  icon: LucideIcon;
  id: string;
  label: string;
  processLabel: string;
  title: string;
};

export const serviceProcessStages: ServiceProcessStage[] = [
  {
    description:
      "Wir betrachten Ihren aktuellen Online-Auftritt, besprechen Ihre Ziele und empfehlen eine passende digitale Lösung.",
    icon: SearchCheck,
    id: "analysis",
    label: "01",
    processLabel: "Analyse",
    title: "Analyse & Beratung"
  },
  {
    description:
      "Wir entwickeln Struktur, Inhalte und Gestaltung passend zu Ihrem Restaurant, Ihrer Zielgruppe und Ihrem Angebot.",
    icon: PanelsTopLeft,
    id: "concept",
    label: "02",
    processLabel: "Konzept",
    title: "Konzept & Design"
  },
  {
    description:
      "Wir erstellen einen schnellen, mobil optimierten und zuverlässigen Online-Auftritt mit allen vereinbarten Funktionen.",
    icon: Code2,
    id: "implementation",
    label: "03",
    processLabel: "Umsetzung",
    title: "Technische Umsetzung"
  },
  {
    description:
      "Wir veröffentlichen Ihre Lösung, unterstützen bei Änderungen und bleiben auch nach dem Start Ihr Ansprechpartner.",
    icon: LifeBuoy,
    id: "launch",
    label: "04",
    processLabel: "Betreuung",
    title: "Start & Betreuung"
  }
];
