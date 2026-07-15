import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b border-white/10">
      <Container className="flex min-h-20 items-center justify-between gap-6 py-4">
        <Link
          href="/"
          className="group inline-flex flex-col focus-visible:rounded-sm"
          aria-label="GastroCraft Startseite"
        >
          <span className="font-heading text-xl font-semibold tracking-wide text-warm-white">
            GastroCraft
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-premium-gold">
            Restaurant Digital Solutions
          </span>
        </Link>
        <nav aria-label="Hauptnavigation" className="hidden items-center gap-8 md:flex">
          <a
            href="#"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-warm-white"
          >
            Lösungen
          </a>
          <a
            href="#"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-warm-white"
          >
            Ansatz
          </a>
          <Button href="#" variant="secondary" size="sm">
            Kontakt
          </Button>
        </nav>
      </Container>
    </header>
  );
}
