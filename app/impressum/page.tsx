import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  alternates: {
    canonical: "/impressum"
  },
  robots: {
    follow: false,
    index: false
  },
  title: "Impressum"
};

export default function ImpressumPage() {
  return (
    <Container className="flex min-h-[calc(100svh-9rem)] items-center py-20 sm:py-24 lg:py-28">
      <div className="max-w-3xl border-l border-premium-gold/60 py-3 pl-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
          Rechtliches
        </p>
        <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight text-warm-white sm:text-5xl">
          Impressum
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Diese Seite ist noch nicht vollständig eingerichtet. Die rechtlichen
          Angaben werden vor dem öffentlichen Start ergänzt.
        </p>
        <Button href="/" variant="secondary" className="mt-10">
          Zurück zur Startseite
        </Button>
      </div>
    </Container>
  );
}
