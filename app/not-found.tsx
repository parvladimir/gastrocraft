import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[calc(100svh-9rem)] items-center py-20 sm:py-24 lg:py-28">
      <div className="max-w-2xl">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
          404
        </p>
        <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight text-warm-white sm:text-5xl">
          Diese Seite wurde nicht gefunden.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Die gewünschte Seite existiert nicht oder wurde verschoben.
        </p>
        <Button href="/" className="mt-10">
          Zur Startseite
        </Button>
      </div>
    </Container>
  );
}
