import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SectionClosingStatement } from "@/components/ui/section-closing-statement";
import {
  referenceProjects,
  type ReferenceProject,
  type ReferenceTheme
} from "@/data/reference-projects";

const themeStyles: Record<
  ReferenceTheme,
  {
    accent: string;
    accentSoft: string;
    browser: string;
    line: string;
    panel: string;
    surface: string;
  }
> = {
  restaurant: {
    accent: "bg-premium-gold",
    accentSoft: "bg-premium-gold/15",
    browser: "bg-[#111c31]",
    line: "bg-premium-gold/55",
    panel: "bg-[#151f32]",
    surface: "bg-midnight"
  },
  rhodos: {
    accent: "bg-[#4c7da6]",
    accentSoft: "bg-[#4c7da6]/18",
    browser: "bg-[#f7f1e7]",
    line: "bg-[#4c7da6]/65",
    panel: "bg-[#173454]",
    surface: "bg-[#102b48]"
  },
  schlemmerhus: {
    accent: "bg-[#c46b32]",
    accentSoft: "bg-[#c46b32]/18",
    browser: "bg-[#161922]",
    line: "bg-[#c46b32]/70",
    panel: "bg-[#241d19]",
    surface: "bg-[#10131b]"
  }
};

export function ReferencesSection() {
  return (
    <section
      id="references"
      className="scroll-mt-2 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="references-heading"
    >
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              Ausgewählte Demo-Projekte
            </p>
            <h2
              id="references-heading"
              className="mt-5 max-w-3xl font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
            >
              Unterschiedliche Restaurants.
              <span className="block text-premium-gold">
                Eine klare digitale Handschrift.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Jedes Gastronomiekonzept braucht einen eigenen Auftritt. Unsere
              Demo-Projekte zeigen, wie flexibel sich Design, Inhalte und
              Funktionen an verschiedene Betriebe anpassen lassen.
            </p>
          </div>

          <p className="inline-flex w-fit rounded border border-premium-gold/35 px-4 py-2 text-sm font-semibold text-premium-gold">
            Konzeptprojekte zur Veranschaulichung
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {referenceProjects.map((project, index) => (
            <ReferenceCard
              key={project.id}
              project={project}
              isFeatured={index === 0}
            />
          ))}
        </div>

        <div className="mt-12">
          <SectionClosingStatement
            firstLine="Ihr Restaurant ist anders."
            secondLine="Ihr digitaler Auftritt sollte es auch sein."
          />
        </div>
      </Container>
    </section>
  );
}

function ReferenceCard({
  isFeatured,
  project
}: {
  isFeatured: boolean;
  project: ReferenceProject;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-lg border border-white/10 bg-[#101a2c] transition-[border-color,transform,background-color] duration-200 hover:border-premium-gold/45 hover:bg-[#111d31] motion-safe:hover:-translate-y-1 ${
        isFeatured ? "lg:col-span-2" : ""
      }`}
    >
      <div
        className={`grid gap-0 ${
          isFeatured ? "lg:grid-cols-[1.15fr_0.85fr]" : ""
        }`}
      >
        <ProjectPreview project={project} isFeatured={isFeatured} />

        <div className="flex flex-col p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded border border-premium-gold/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-premium-gold">
              Demo-Projekt
            </span>
            <span className="text-sm font-medium text-slate-400">
              {project.category}
            </span>
          </div>

          <h3 className="mt-6 font-heading text-2xl font-semibold leading-8 text-warm-white">
            {project.title}
          </h3>
          <p className="mt-4 text-base leading-7 text-slate-400">
            {project.description}
          </p>

          <div className="mt-8">
            <Button
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              aria-label={`Live-Demo von ${project.title} in neuem Tab ansehen`}
              className="group/link min-w-52 gap-2"
            >
              Live-Demo ansehen
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              />
              <span className="sr-only">öffnet in neuem Tab</span>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProjectPreview({
  isFeatured,
  project
}: {
  isFeatured: boolean;
  project: ReferenceProject;
}) {
  const styles = themeStyles[project.theme];

  return (
    <div
      className={`relative min-h-[22rem] border-b border-white/10 p-5 sm:p-6 lg:border-b-0 ${
        isFeatured ? "lg:border-r" : ""
      } lg:border-white/10`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_52%)]" />
      <div className="relative mx-auto max-w-xl">
        <div
          className={`rounded-lg border border-white/12 ${styles.browser} p-3 shadow-[0_22px_60px_rgba(0,0,0,0.28)]`}
        >
          <div className="flex items-center gap-2 border-b border-black/10 pb-3">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.accent}`} />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-gray" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
            <span className="ml-3 h-6 flex-1 rounded border border-white/10 bg-black/10" />
          </div>

          {project.theme === "restaurant" ? (
            <RestaurantPreview styles={styles} />
          ) : null}
          {project.theme === "rhodos" ? <RhodosPreview styles={styles} /> : null}
          {project.theme === "schlemmerhus" ? (
            <SchlemmerhusPreview styles={styles} />
          ) : null}
        </div>

        <div className="absolute -bottom-7 right-4 hidden w-28 rounded-lg border border-white/12 bg-midnight p-2 shadow-[0_16px_38px_rgba(0,0,0,0.3)] sm:block">
          <div className={`h-20 rounded ${styles.panel} p-2`}>
            <div className={`h-2 w-8 rounded ${styles.accent}`} />
            <div className="mt-4 h-2 w-14 rounded bg-white/45" />
            <div className="mt-2 h-2 w-10 rounded bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RestaurantPreview({
  styles
}: {
  styles: (typeof themeStyles)[ReferenceTheme];
}) {
  return (
    <div className={`mt-3 rounded-md ${styles.surface} p-4`}>
      <div className="flex items-center justify-between gap-4">
        <div className="h-3 w-24 rounded bg-warm-white/80" />
        <div className={`h-7 w-24 rounded ${styles.accent}`} />
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className={`h-2.5 w-20 rounded ${styles.line}`} />
          <div className="mt-4 h-5 w-48 max-w-full rounded bg-warm-white/85" />
          <div className="mt-3 h-4 w-36 rounded bg-white/30" />
          <div className={`mt-6 h-9 w-32 rounded ${styles.accentSoft}`} />
        </div>
        <div className={`rounded border border-white/10 ${styles.panel} p-4`}>
          <div className={`h-24 rounded ${styles.accentSoft}`} />
          <div className="mt-4 h-3 w-24 rounded bg-white/45" />
          <div className="mt-2 h-3 w-16 rounded bg-white/25" />
        </div>
      </div>
    </div>
  );
}

function RhodosPreview({
  styles
}: {
  styles: (typeof themeStyles)[ReferenceTheme];
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md bg-[#fbf7ef] text-[#102b48]">
      <div className="flex items-center justify-between border-b border-[#102b48]/10 px-4 py-3">
        <div className="h-3 w-24 rounded bg-[#102b48]" />
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#4c7da6]" />
          <span className="h-2 w-2 rounded-full bg-[#4c7da6]" />
          <span className="h-2 w-2 rounded-full bg-[#4c7da6]" />
        </div>
      </div>
      <div className={`${styles.panel} p-4 text-warm-white`}>
        <div className={`h-2.5 w-24 rounded ${styles.accent}`} />
        <div className="mt-4 h-5 w-44 rounded bg-warm-white/90" />
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded border border-white/12 bg-white/8 p-3">
              <div className="h-10 rounded bg-warm-white/75" />
              <div className="mt-3 h-2 w-12 rounded bg-white/45" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchlemmerhusPreview({
  styles
}: {
  styles: (typeof themeStyles)[ReferenceTheme];
}) {
  return (
    <div className={`mt-3 rounded-md ${styles.surface} p-4`}>
      <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <div className={`rounded ${styles.panel} p-4`}>
          <div className={`h-2.5 w-16 rounded ${styles.accent}`} />
          <div className="mt-4 h-6 w-28 rounded bg-warm-white/85" />
          <div className="mt-3 h-3 w-20 rounded bg-white/30" />
          <div className="mt-8 flex items-center gap-2 text-[#c46b32]">
            <span className={`h-px flex-1 ${styles.line}`} />
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`rounded border border-white/10 ${styles.panel} p-3`}>
              <div className={`h-8 rounded ${item === 1 ? styles.accent : styles.accentSoft}`} />
              <div className="mt-3 h-2 w-14 rounded bg-white/45" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
