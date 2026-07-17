import { Check } from "lucide-react";

const trustItems = [
  "Persönlicher Ansprechpartner",
  "Klare Einstiegspreise",
  "Für Mobilgeräte optimiert"
];

export function HeroTrustItems() {
  return (
    <ul className="mt-7 grid max-w-[43rem] gap-2.5 text-sm font-medium leading-6 text-slate-300 sm:grid-cols-3 sm:gap-x-3 lg:text-[0.78rem] xl:text-[0.8rem]">
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
