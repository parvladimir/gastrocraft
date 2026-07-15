import { Check } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  monthlySupport,
  servicePackages,
  type ServicePackage
} from "@/data/service-packages";

export function PackagesSection() {
  return (
    <section
      id="packages"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="packages-heading"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              Transparente Pakete
            </p>
            <h2
              id="packages-heading"
              className="mt-5 font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
            >
              Der passende digitale Auftritt für Ihr Restaurant.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Vom kompakten Einstieg bis zur umfassenden digitalen Lösung:
              Wählen Sie den Umfang, der zu Ihrem Betrieb passt.
            </p>
          </div>

          <p className="max-w-xl rounded-lg border border-white/10 bg-[#101a2c] px-5 py-4 text-sm leading-6 text-slate-300">
            Alle Preise sind Einstiegspreise und werden nach dem tatsächlichen
            Projektumfang konkret angeboten.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {servicePackages.map((servicePackage) => (
            <PackageCard key={servicePackage.id} servicePackage={servicePackage} />
          ))}
        </div>

        <SupportBlock />

        <div className="mt-12 max-w-3xl border-l border-premium-gold/50 pl-5">
          <p className="font-heading text-xl font-semibold leading-8 text-warm-white sm:text-2xl">
            Sie wissen noch nicht, welches Paket passt?
            <span className="block text-premium-gold">
              Wir empfehlen Ihnen kostenlos die passende Lösung.
            </span>
          </p>
        </div>
      </Container>
    </section>
  );
}

function PackageCard({
  servicePackage
}: {
  servicePackage: ServicePackage;
}) {
  const variant = servicePackage.featured ? "primary" : "secondary";

  return (
    <article
      className={`group flex h-full min-h-[39rem] flex-col rounded-lg border p-6 transition-[border-color,transform,box-shadow] duration-200 motion-safe:hover:-translate-y-1 ${
        servicePackage.featured
          ? "border-premium-gold/70 bg-warm-white text-midnight shadow-[0_22px_60px_rgba(0,0,0,0.24)]"
          : "border-white/10 bg-[#101a2c] text-warm-white hover:border-premium-gold/45"
      }`}
      aria-label={
        servicePackage.featured
          ? `${servicePackage.name}, empfohlenes Paket`
          : servicePackage.name
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-2xl font-semibold leading-8">
            {servicePackage.name}
          </h3>
          {servicePackage.featured ? (
            <p className="mt-2 text-sm font-semibold text-midnight/70">
              Empfohlenes Paket
            </p>
          ) : null}
        </div>
        {servicePackage.badge ? (
          <span className="rounded border border-premium-gold/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-midnight">
            {servicePackage.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-7">
        <p className="font-heading text-4xl font-semibold leading-none">
          {servicePackage.price}
        </p>
        <p
          className={`mt-2 text-sm ${
            servicePackage.featured ? "text-midnight/65" : "text-slate-400"
          }`}
        >
          {servicePackage.suffix}
        </p>
      </div>

      <p
        className={`mt-6 min-h-20 text-base leading-7 ${
          servicePackage.featured ? "text-midnight/75" : "text-slate-400"
        }`}
      >
        {servicePackage.description}
      </p>

      <div
        className={`my-7 h-px w-full ${
          servicePackage.featured ? "bg-midnight/12" : "bg-white/10"
        }`}
      />

      <ul className="grid gap-3">
        {servicePackage.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-6">
            <Check
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold"
              strokeWidth={1.9}
            />
            <span
              className={
                servicePackage.featured ? "text-midnight/75" : "text-slate-300"
              }
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Button
          href={servicePackage.ctaHref}
          variant={variant}
          className="w-full"
        >
          {servicePackage.ctaLabel}
        </Button>
      </div>
    </article>
  );
}

function SupportBlock() {
  return (
    <article className="mt-6 rounded-lg border border-premium-gold/35 bg-[#101a2c] p-6 sm:p-7 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
            Monatliche Unterstützung
          </p>
          <h3 className="mt-4 font-heading text-3xl font-semibold leading-tight text-warm-white">
            {monthlySupport.title}
          </h3>
          <p className="mt-4 font-heading text-3xl font-semibold text-premium-gold">
            {monthlySupport.price}
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            {monthlySupport.description}
          </p>
          <p className="mt-4 text-sm text-slate-400">{monthlySupport.note}</p>
        </div>

        <div className="flex h-full flex-col">
          <ul className="grid gap-3 sm:grid-cols-2">
            {monthlySupport.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold"
                  strokeWidth={1.9}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 lg:mt-auto">
            <Button
              href={monthlySupport.ctaHref}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {monthlySupport.ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
