import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <Container className="py-24 sm:py-32">
      <section className="max-w-4xl">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-premium-gold">
          Restaurant Digital Solutions
        </p>
        <h1 className="mt-8 font-heading text-5xl font-semibold leading-[1.05] text-warm-white sm:text-6xl lg:text-7xl">
          Ihre Gäste suchen online.
          <span className="block text-premium-gold">
            Wir sorgen dafür, dass sie Sie finden.
          </span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
          Wir verkaufen keine Websites. Wir entwickeln digitale Lösungen für
          Restaurants.
        </p>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Button href="#" variant="primary">
            Erstgespräch planen
          </Button>
          <Button href="#" variant="secondary">
            Leistungen ansehen
          </Button>
          <Button href="#" variant="link">
            Mehr über GastroCraft
          </Button>
        </div>
      </section>
    </Container>
  );
}
