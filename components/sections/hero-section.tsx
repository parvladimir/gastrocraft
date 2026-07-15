import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="overflow-hidden" aria-labelledby="hero-heading">
      <Container className="grid min-h-[calc(100vh-5rem)] items-center gap-16 py-20 sm:py-24 lg:grid-cols-[1fr_0.88fr] lg:py-28">
        <div className="max-w-3xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-premium-gold">
            Restaurant Digital Solutions
          </p>
          <h1
            id="hero-heading"
            aria-label="Ihre Gäste suchen online. Wir sorgen dafür, dass sie Sie finden."
            className="mt-7 font-heading text-4xl font-semibold leading-[1.06] text-warm-white sm:text-6xl lg:text-7xl"
          >
            <span className="block">Ihre Gäste suchen online.</span>
            <span className="block text-premium-gold">Wir sorgen dafür,</span>
            <span className="block text-premium-gold">
              dass sie Sie finden.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Wir entwickeln moderne digitale Lösungen für Restaurants - von der
            professionellen Website und digitalen Speisekarte bis zur
            Google-Optimierung und laufenden Betreuung.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="#contact" variant="primary" className="min-w-52">
              Kostenlose Demo erhalten
            </Button>
            <Button href="#references" variant="secondary" className="min-w-48">
              Referenzen ansehen
            </Button>
          </div>
          <p className="mt-8 inline-flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="h-px w-8 bg-premium-gold" aria-hidden="true" />
            Modern. Persönlich. Für die Gastronomie entwickelt.
          </p>
        </div>

        <div
          className="relative mx-auto w-full max-w-xl lg:mx-0"
          aria-hidden="true"
        >
          <div className="absolute -left-6 top-10 hidden h-28 w-28 rounded border border-premium-gold/30 sm:block" />
          <div className="absolute -right-5 bottom-12 hidden h-20 w-20 rounded border border-white/10 sm:block" />

          <div className="relative rounded-lg border border-white/12 bg-[#111c31] p-4 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-premium-gold" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-gray" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              <span className="ml-3 h-7 flex-1 rounded border border-white/10 bg-midnight/70" />
            </div>

            <div className="grid gap-4 pt-5">
              <div className="rounded border border-white/10 bg-midnight p-5">
                <div className="h-3 w-24 rounded bg-premium-gold" />
                <div className="mt-5 h-4 w-4/5 rounded bg-warm-white/85" />
                <div className="mt-3 h-4 w-3/5 rounded bg-white/30" />
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="h-16 rounded border border-white/10 bg-[#172238]" />
                  <div className="h-16 rounded border border-premium-gold/35 bg-[#172238]" />
                  <div className="h-16 rounded border border-white/10 bg-[#172238]" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Digitale Speisekarte",
                  "Google sichtbar",
                  "Direkt erreichbar"
                ].map((label) => (
                  <div
                    key={label}
                    className="rounded border border-white/10 bg-midnight px-4 py-4"
                  >
                    <div className="mb-4 flex h-8 w-8 items-center justify-center rounded border border-premium-gold/40 text-premium-gold">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold leading-5 text-warm-white">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 left-6 right-6 rounded border border-premium-gold/30 bg-midnight px-5 py-4 shadow-xl shadow-black/25">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-warm-white">
                GastroCraft
              </span>
              <span className="rounded border border-premium-gold/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-premium-gold">
                Online bereit
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
