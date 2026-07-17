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
          <Reveal className="max-w-2xl lg:sticky lg:top-28">
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

            <div className="mt-10 border-l border-premium-gold/55 py-2 pl-5">
              <p className="font-heading text-lg font-semibold leading-7 text-warm-white">
                Sie möchten lieber direkt sprechen?
                <span className="mt-1 block text-slate-300">
                  Rufen Sie uns an oder schreiben Sie per WhatsApp.
                </span>
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="tel:+4917624229299"
                  className="inline-flex min-h-10 items-center justify-center rounded border border-premium-gold/60 px-4 text-sm font-semibold text-premium-gold transition-[background-color,border-color,transform] duration-200 ease-out hover:border-premium-gold hover:bg-premium-gold/8 active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]"
                >
                  Andrej anrufen
                </a>
                <a
                  href="https://wa.me/380678400156"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded border border-premium-gold/60 px-4 text-sm font-semibold text-premium-gold transition-[background-color,border-color,transform] duration-200 ease-out hover:border-premium-gold hover:bg-premium-gold/8 active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]"
                >
                  WhatsApp schreiben
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <FaqAccordion items={faqItems} />
            <div className="mt-10 lg:mt-12">
              <SectionClosingStatement
                firstLine="Sie haben eine andere Frage?"
                secondLine="Sprechen Sie uns einfach an."
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
