import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionClosingStatement } from "@/components/ui/section-closing-statement";
import {
  serviceProcessStages,
  type ServiceProcessStage
} from "@/data/service-process";

export function ServicesSection() {
  return (
    <section
      id="services"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="services-heading"
    >
      <Container>
        <Reveal className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              Unsere Leistungen
            </p>
            <h2
              id="services-heading"
              className="mt-5 font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
            >
              Von der ersten Idee bis zur laufenden Betreuung.
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:justify-self-end">
            Wir begleiten Ihr Restaurant Schritt für Schritt – von der Analyse
            und Konzeption über Design und Umsetzung bis zur langfristigen Pflege
            Ihres digitalen Auftritts.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <ProcessLine />
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-5">
          {serviceProcessStages.map((stage, index) => (
            <Reveal
              key={stage.id}
              className="h-full"
              delay={index % 2 === 0 ? 0 : 80}
            >
              <ServiceStageCard stage={stage} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12">
          <SectionClosingStatement
            firstLine="Ein klarer Prozess. Ein persönlicher Ansprechpartner."
            secondLine="Damit aus einer Idee eine funktionierende digitale Lösung wird."
          />
        </div>
      </Container>
    </section>
  );
}

function ProcessLine() {
  return (
    <div
      className="mt-12 rounded-lg border border-white/10 bg-[#101a2c] px-5 py-5 sm:px-6 lg:px-7"
      aria-label="Prozess: Analyse, Konzept, Umsetzung, Betreuung"
    >
      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
        <div
          className="absolute bottom-5 left-[1.125rem] top-5 w-px bg-premium-gold/25 sm:hidden"
          aria-hidden="true"
        />
        {serviceProcessStages.map((stage, index) => (
          <div key={stage.id} className="contents">
            <div className="relative flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-premium-gold/45 font-heading text-sm font-semibold text-premium-gold">
                {stage.label}
              </span>
              <span className="font-heading text-lg font-semibold text-warm-white">
                {stage.processLabel}
              </span>
            </div>
            {index < serviceProcessStages.length - 1 ? (
              <ArrowRight
                aria-hidden="true"
                className="hidden h-5 w-5 text-premium-gold/70 lg:block"
                strokeWidth={1.8}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceStageCard({ stage }: { stage: ServiceProcessStage }) {
  const Icon = stage.icon;

  return (
    <article className="group relative flex min-h-[20rem] h-full flex-col rounded-lg border border-white/10 bg-midnight p-6 shadow-[0_12px_34px_rgba(0,0,0,0.1)] transition-[border-color,transform,background-color,box-shadow] duration-200 ease-out hover:border-premium-gold/45 hover:bg-[#111d31] hover:shadow-[0_18px_42px_rgba(0,0,0,0.18)] motion-safe:hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded border border-white/12 text-slate-300 transition-colors duration-200 group-hover:border-premium-gold/45 group-hover:text-premium-gold">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span className="font-heading text-sm font-semibold text-premium-gold/80">
          {stage.label}
        </span>
      </div>

      <div className="mt-8 h-px w-12 bg-premium-gold/45" />

      <div className="mt-6">
        <h3 className="font-heading text-xl font-semibold leading-7 text-warm-white">
          {stage.title}
        </h3>
        <p className="mt-4 text-base leading-7 text-slate-400">
          {stage.description}
        </p>
      </div>
    </article>
  );
}
