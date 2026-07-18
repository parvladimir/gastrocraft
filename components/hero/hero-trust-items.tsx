import { Check } from "lucide-react";

const trustItems = [
  "Persönlicher Ansprechpartner",
  "Klare Einstiegspreise",
  "Für Mobilgeräte optimiert"
];

export function HeroTrustItems() {
  return (
    <ul className="mt-8 grid max-w-[42rem] grid-cols-1 gap-x-6 gap-y-3 text-sm font-medium leading-6 text-slate-300 sm:grid-cols-2 xl:grid-cols-3">
      {trustItems.map((item) => (
        <li key={item} className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-premium-gold/45 text-premium-gold"
            aria-hidden="true"
          >
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 xl:whitespace-nowrap">{item}</span>
        </li>
      ))}
    </ul>
  );
}
