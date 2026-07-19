"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body>
        <main className="min-h-screen bg-midnight px-6 py-20 text-warm-white">
          <div className="mx-auto flex min-h-[calc(100svh-10rem)] max-w-2xl flex-col justify-center">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              DINEVIO
            </p>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
              Etwas ist schiefgelaufen.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Die Seite konnte nicht geladen werden. Bitte versuchen Sie es
              erneut.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded bg-premium-gold px-6 text-base font-semibold text-midnight transition-colors duration-200 hover:bg-[#d6b238] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]"
                onClick={reset}
              >
                Erneut versuchen
              </button>
              <Button href="/" variant="secondary">
                Zur Startseite
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
