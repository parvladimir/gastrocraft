import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Globe2,
  Headphones,
  MessageCircle,
  QrCode,
  Search
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";

type Solution = {
  description: string;
  icon: LucideIcon;
  number: string;
  title: string;
};

const solutions: Solution[] = [
  {
    description:
      "Ein moderner, schneller und mobil optimierter Online-Auftritt, der Ihr Restaurant hochwertig präsentiert.",
    icon: Globe2,
    number: "01",
    title: "Professionelle Website"
  },
  {
    description:
      "Ihre Speisekarte jederzeit online erreichbar, übersichtlich dargestellt und schnell aktualisierbar.",
    icon: BookOpen,
    number: "02",
    title: "Digitale Speisekarte"
  },
  {
    description:
      "Aktuelle Informationen, bessere lokale Auffindbarkeit und ein professioneller Auftritt bei Google.",
    icon: Search,
    number: "03",
    title: "Google-Sichtbarkeit"
  },
  {
    description:
      "Anrufe, WhatsApp, Reservierungen und Routenplanung ohne unnötige Umwege.",
    icon: MessageCircle,
    number: "04",
    title: "Direkter Gästekontakt"
  },
  {
    description:
      "QR-Codes für Tische, Fenster, Flyer und Speisekarten mit direktem Zugang zu Ihren Inhalten.",
    icon: QrCode,
    number: "05",
    title: "QR-Lösungen"
  },
  {
    description:
      "Wir aktualisieren Inhalte, Preise, Öffnungszeiten und Aktionen auch nach dem Start.",
    icon: Headphones,
    number: "06",
    title: "Laufende Betreuung"
  }
];

export function SolutionsSection() {
  return (
    <section
      id="solutions"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="solutions-heading"
    >
      <Container>
        <Reveal className="max-w-3xl">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
            Digitale Lösungen für die Gastronomie
          </p>
          <h2
            id="solutions-heading"
            className="mt-5 font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
          >
            Alles, was Ihr Restaurant online braucht.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Von der modernen Website bis zur laufenden Betreuung: Wir verbinden
            alle wichtigen digitalen Bausteine zu einer Lösung, die zu Ihrem
            Restaurant passt.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {solutions.map((solution, index) => (
            <Reveal
              key={solution.number}
              className="h-full"
              delay={index % 3 === 0 ? 0 : index % 3 === 1 ? 80 : 120}
            >
              <SolutionCard solution={solution} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 max-w-3xl border-l border-premium-gold/50 pl-5">
          <p className="font-heading text-xl font-semibold leading-8 text-warm-white sm:text-2xl">
            Wir verkaufen keine einzelnen Bausteine.
            <span className="block text-premium-gold">
              Wir entwickeln eine digitale Lösung, die als Ganzes funktioniert.
            </span>
          </p>
        </div>
      </Container>
    </section>
  );
}

function SolutionCard({ solution }: { solution: Solution }) {
  const Icon = solution.icon;

  return (
    <article className="group flex min-h-[18rem] h-full flex-col rounded-lg border border-white/10 bg-[#101a2c] p-6 shadow-[0_12px_34px_rgba(0,0,0,0.12)] transition-[border-color,transform,background-color,box-shadow] duration-200 ease-out hover:border-premium-gold/45 hover:bg-[#111d31] hover:shadow-[0_18px_42px_rgba(0,0,0,0.18)] motion-safe:hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded border border-premium-gold/35 text-premium-gold transition-colors duration-200 group-hover:border-premium-gold">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span className="font-heading text-sm font-semibold text-slate-500 transition-colors duration-200 group-hover:text-premium-gold/80">
          {solution.number}
        </span>
      </div>

      <div className="mt-8 h-px w-10 bg-premium-gold/40 transition-colors duration-200 group-hover:bg-premium-gold" />

      <div className="mt-6">
        <h3 className="font-heading text-xl font-semibold leading-7 text-warm-white">
          {solution.title}
        </h3>
        <p className="mt-4 text-base leading-7 text-slate-400">
          {solution.description}
        </p>
      </div>
    </article>
  );
}
