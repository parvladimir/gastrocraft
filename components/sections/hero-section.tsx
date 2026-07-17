import { HeroInterfaceVisual } from "@/components/hero/hero-interface-visual";
import { HeroTrustItems } from "@/components/hero/hero-trust-items";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="overflow-hidden" aria-labelledby="hero-heading">
      <Container className="grid min-h-[calc(100svh-4.5rem)] min-w-0 items-center gap-12 pb-14 pt-12 sm:pb-16 sm:pt-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,0.88fr)] lg:gap-12 lg:pb-16 lg:pt-12 xl:gap-14">
        <div className="min-w-0 max-w-[45rem] lg:-mt-8">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
            Restaurant Digital Solutions
          </p>
          <h1
            id="hero-heading"
            aria-label="Ihre Gäste suchen online. Wir sorgen dafür, dass sie Sie finden."
            className="mt-6 max-w-[46rem] font-heading text-[2.55rem] font-semibold leading-[1.04] text-warm-white sm:text-[3.45rem] sm:leading-[1.04] lg:text-[3.85rem] xl:text-[4.2rem]"
          >
            <span className="hero-reveal-line block">
              Ihre Gäste suchen online.
            </span>
            <span className="hero-reveal-line hero-reveal-delay-1 block text-premium-gold">
              Wir sorgen dafür,
            </span>
            <span className="hero-reveal-line hero-reveal-delay-2 block text-premium-gold">
              dass sie Sie finden.
            </span>
          </h1>
          <p className="mt-6 max-w-[38rem] text-base leading-8 text-slate-300 sm:text-lg">
            Wir entwickeln moderne digitale Lösungen für Restaurants – von der
            professionellen Website und digitalen Speisekarte bis zur
            Google-Optimierung und laufenden Betreuung.
          </p>
          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Button href="#contact" variant="primary" className="min-w-56">
              Kostenlose Demo erhalten
            </Button>
            <Button href="#references" variant="secondary" className="min-w-48">
              Referenzen ansehen
            </Button>
          </div>
          <HeroTrustItems />
        </div>

        <HeroInterfaceVisual />
      </Container>
    </section>
  );
}
