import { FaqAccordion } from "@/components/faq/faq-accordion";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionClosingStatement } from "@/components/ui/section-closing-statement";
import { faqItems } from "@/data/faq-items";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="faq-heading"
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-14">
          <Reveal className="max-w-2xl">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              Häufige Fragen
            </p>
            <h2
              id="faq-heading"
              className="mt-5 font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
            >
              Noch Fragen?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Die wichtigsten Antworten auf einen Blick.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <FaqAccordion items={faqItems} />
          </Reveal>
        </div>

        <div className="pt-14 sm:pt-16 lg:pt-20">
          <SectionClosingStatement
            firstLine="Sie haben eine andere Frage?"
            secondLine="Sprechen Sie uns einfach an."
          />
        </div>
      </Container>
    </section>
  );
}
