import { Check } from "lucide-react";

const trustItems = [
  "Persönlicher Ansprechpartner",
  "Klare Einstiegspreise",
  "Für Mobilgeräte optimiert"
];

export function HeroTrustItems() {
  return (
    <ul className="mt-7 flex max-w-[42rem] flex-col gap-2.5 text-sm font-medium leading-6 text-slate-300 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3">
      {trustItems.map((item) => (
        <li key={item} className="flex min-w-0 items-center gap-2.5">
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-premium-gold/45 text-premium-gold"
            aria-hidden="true"
          >
            <Check className="h-3.5 w-3.5" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
