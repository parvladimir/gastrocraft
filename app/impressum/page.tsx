import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function ImpressumPage() {
  return (
    <Container className="py-20 sm:py-24 lg:py-28">
      <div className="max-w-3xl">
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
        <Link
          href="/"
          className="mt-10 inline-flex text-base font-semibold text-premium-gold underline-offset-4 hover:text-warm-white hover:underline focus-visible:rounded-sm"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </Container>
  );
}
