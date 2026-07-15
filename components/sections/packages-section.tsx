import type { CSSProperties } from "react";
import { Check, Info } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  monthlySupport,
  servicePackages,
  type ServicePackage
} from "@/data/service-packages";

const featuredCardStyle: CSSProperties = {
  backgroundColor: "var(--brand-warm-white)",
  borderColor: "var(--brand-premium-gold)",
  color: "var(--brand-midnight)"
};

export function PackagesSection() {
  return (
    <section
      id="packages"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="packages-heading"
    >
      <Container>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.55fr)] lg:items-end lg:gap-12">
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

          <div className="flex max-w-xl gap-3 rounded-lg border border-white/10 bg-[#101a2c] px-4 py-3.5 text-sm leading-6 text-slate-300 lg:justify-self-end">
            <Info
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold"
              strokeWidth={1.9}
            />
            <p>
              Alle Preise sind Einstiegspreise und werden nach dem tatsächlichen
              Projektumfang konkret angeboten.
            </p>
          </div>
        </div>

        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:pt-4">
          {servicePackages.map((servicePackage) => (
            <PackageCard key={servicePackage.id} servicePackage={servicePackage} />
          ))}
        </div>

        <SupportBlock />

        <div className="mt-14 max-w-3xl border-l border-premium-gold/60 py-2 pl-6 sm:mt-16 sm:py-3 lg:mt-20 lg:pl-7">
          <p className="font-heading text-xl font-semibold leading-8 text-warm-white sm:text-2xl sm:leading-9">
            Sie wissen noch nicht, welches Paket passt?
            <span className="mt-1 block text-premium-gold sm:mt-1.5">
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
  const isFeatured = servicePackage.featured;
  const cardStyle = isFeatured ? featuredCardStyle : undefined;

  return (
    <article
      className={`group flex h-full min-h-[32rem] flex-col rounded-lg border p-6 transition-[border-color,transform,box-shadow,background-color] duration-200 md:min-h-[34rem] ${
        isFeatured
          ? "order-first shadow-[0_18px_46px_rgba(0,0,0,0.22)] motion-safe:lg:-translate-y-4 motion-safe:hover:lg:-translate-y-5 md:order-none"
          : "border-white/10 bg-[#101a2c] text-warm-white hover:border-premium-gold/45 motion-safe:hover:-translate-y-1"
      }`}
      style={cardStyle}
      aria-label={
        isFeatured
          ? `${servicePackage.name}, empfohlenes Paket`
          : servicePackage.name
      }
    >
      <div className="flex min-h-16 items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-2xl font-semibold leading-8">
            {servicePackage.name}
          </h3>
          {isFeatured ? (
            <p className="mt-1.5 text-sm font-semibold text-[rgba(15,23,42,0.68)]">
              Empfohlenes Paket
            </p>
          ) : null}
        </div>
        {servicePackage.badge ? (
          <span
            className="rounded px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{
              backgroundColor: "var(--brand-premium-gold)",
              color: "var(--brand-midnight)"
            }}
          >
            {servicePackage.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="font-heading text-4xl font-semibold leading-none">
          {servicePackage.price}
        </p>
        <p
          className={`mt-2 text-sm ${
            isFeatured ? "text-[rgba(15,23,42,0.66)]" : "text-slate-400"
          }`}
        >
          {servicePackage.suffix}
        </p>
      </div>

      <p
        className={`mt-5 text-base leading-7 ${
          isFeatured ? "text-[rgba(15,23,42,0.76)]" : "text-slate-400"
        }`}
      >
        {servicePackage.description}
      </p>

      <div
        className={`my-6 h-px w-full ${
          isFeatured ? "bg-[rgba(15,23,42,0.14)]" : "bg-white/10"
        }`}
      />

      <ul className="grid gap-2.5">
        {servicePackage.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-6">
            <Check
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold"
              strokeWidth={1.9}
            />
            <span
              className={
                isFeatured ? "text-[rgba(15,23,42,0.76)]" : "text-slate-300"
              }
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        <Button
          href={servicePackage.ctaHref}
          variant={isFeatured ? "primary" : "secondary"}
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
    <article className="mt-8 rounded-lg border border-white/10 bg-[#101a2c] p-5 sm:p-6 lg:p-7">
      <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
            Monatliche Unterstützung
          </p>
          <h3 className="mt-3 font-heading text-2xl font-semibold leading-tight text-warm-white sm:text-3xl">
            {monthlySupport.title}
          </h3>
          <p className="mt-3 font-heading text-2xl font-semibold text-premium-gold sm:text-3xl">
            {monthlySupport.price}
          </p>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            {monthlySupport.description}
          </p>
          <p className="mt-3 text-sm text-slate-400">{monthlySupport.note}</p>
        </div>

        <div className="flex h-full flex-col">
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
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
          <div className="mt-6 lg:mt-auto lg:self-end">
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
