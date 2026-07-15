import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

const serviceHints = [
  "Digitale Speisekarte",
  "Google sichtbar",
  "Direkt erreichbar"
];

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
          <p className="mt-7 inline-flex max-w-full items-center gap-3 text-sm font-medium leading-6 text-slate-400">
            <span className="h-px w-8 shrink-0 bg-premium-gold" aria-hidden="true" />
            <span>Modern. Persönlich. Für die Gastronomie entwickelt.</span>
          </p>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}

function HeroVisual() {
  return (
    <div
      className="relative mx-auto w-full min-w-0 max-w-[34rem] lg:mx-0 lg:-mt-4"
      aria-hidden="true"
    >
      <div className="absolute -left-5 top-12 hidden h-32 w-28 rounded-lg border border-premium-gold/25 bg-midnight/60 sm:block" />
      <div className="absolute -right-4 bottom-16 hidden h-24 w-24 rounded-lg border border-white/10 bg-[#101a2c] sm:block" />

      <div className="relative rounded-lg border border-white/12 bg-[#111c31] p-3.5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-4">
        <div className="rounded-md border border-white/10 bg-midnight">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-premium-gold" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-gray" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            <span className="ml-3 h-7 flex-1 rounded border border-white/10 bg-[#111c31]" />
          </div>

          <div className="grid gap-4 p-4 sm:p-5">
            <div className="rounded-md border border-white/10 bg-[#111c31] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="h-2.5 w-24 rounded bg-premium-gold" />
                  <div className="mt-5 h-4 w-52 max-w-full rounded bg-warm-white/85" />
                  <div className="mt-3 h-3.5 w-40 max-w-[80%] rounded bg-white/28" />
                </div>
                <div className="hidden rounded border border-premium-gold/35 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-premium-gold sm:block">
                  Sichtbar
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="h-[4.5rem] overflow-hidden rounded border border-white/10 bg-[#172238] p-2 sm:p-3">
                  <div className="h-2 w-10 rounded bg-white/35" />
                  <div className="mt-3 h-2 w-14 rounded bg-white/18" />
                </div>
                <div className="h-[4.5rem] overflow-hidden rounded border border-premium-gold/35 bg-[#172238] p-2 sm:p-3">
                  <div className="h-2 w-10 rounded bg-premium-gold" />
                  <div className="mt-3 h-2 w-12 rounded bg-white/25" />
                </div>
                <div className="h-[4.5rem] overflow-hidden rounded border border-white/10 bg-[#172238] p-2 sm:p-3">
                  <div className="h-2 w-10 rounded bg-white/35" />
                  <div className="mt-3 h-2 w-16 rounded bg-white/18" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {serviceHints.map((label) => (
                <ServiceHint key={label} label={label} />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-6 left-4 right-4 rounded-md border border-premium-gold/25 bg-[#101a2c] px-4 py-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] sm:left-6 sm:right-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warm-white">GastroCraft</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Digitale Präsenz für Restaurants
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-premium-gold/35 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-premium-gold">
              <Check className="h-3.5 w-3.5" />
              Bereit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceHint({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#101a2c] px-4 py-4">
      <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded border border-premium-gold/35 text-premium-gold">
        <ExternalLink className="h-3.5 w-3.5" />
      </div>
      <p className="text-sm font-semibold leading-5 text-warm-white">{label}</p>
      <div className="mt-4 flex items-center text-premium-gold/80">
        <span className="h-px flex-1 bg-premium-gold/25" />
        <ArrowRight className="ml-2 h-3.5 w-3.5" />
      </div>
    </div>
  );
}
