import { Container } from "@/components/layout/container";
import { SectionClosingStatement } from "@/components/ui/section-closing-statement";
import {
  companyBenefits,
  type CompanyBenefit
} from "@/data/company-benefits";

export function WhyGastroCraftSection() {
  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-heading"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
          <div className="max-w-2xl">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              Warum GastroCraft
            </p>
            <h2
              id="about-heading"
              className="mt-5 font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
            >
              Mehr als eine Website.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Wir entwickeln digitale Lösungen, die Restaurants langfristig
              unterstützen – professionell, zuverlässig und ohne unnötige
              Komplexität.
            </p>

            <div className="mt-10 border-l border-premium-gold/60 py-2 pl-6">
              <p className="font-heading text-xl font-semibold leading-8 text-warm-white sm:text-2xl sm:leading-9">
                Wir glauben, dass jedes Restaurant einen professionellen
                digitalen Auftritt verdient.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {companyBenefits.map((benefit) => (
              <BenefitCard key={benefit.number} benefit={benefit} />
            ))}
          </div>
        </div>

        <div className="pt-14 sm:pt-16 lg:pt-20">
          <SectionClosingStatement
            firstLine="Keine Agentur von der Stange."
            secondLine="Ein langfristiger digitaler Partner."
          />
        </div>
      </Container>
    </section>
  );
}

function BenefitCard({ benefit }: { benefit: CompanyBenefit }) {
  const Icon = benefit.icon;

  return (
    <article className="group rounded-lg border border-white/10 bg-[#101a2c] p-5 transition-[border-color,transform,background-color] duration-200 hover:border-premium-gold/45 hover:bg-[#111d31] motion-safe:hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-white/12 text-slate-300 transition-colors duration-200 group-hover:border-premium-gold/45 group-hover:text-premium-gold">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span className="font-heading text-sm font-semibold text-slate-500 transition-colors duration-200 group-hover:text-premium-gold/80">
          {benefit.number}
        </span>
      </div>

      <div className="mt-6 h-px w-10 bg-premium-gold/35 transition-colors duration-200 group-hover:bg-premium-gold" />

      <h3 className="mt-5 font-heading text-lg font-semibold leading-7 text-warm-white">
        {benefit.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {benefit.description}
      </p>
    </article>
  );
}
