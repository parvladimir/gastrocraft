import type { CSSProperties } from "react";
import { Check, Info } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionClosingStatement } from "@/components/ui/section-closing-statement";
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
        <Reveal className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.55fr)] lg:items-end lg:gap-12">
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
        </Reveal>

        <div className="mt-12 grid min-w-0 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:pt-4">
          {servicePackages.map((servicePackage, index) => (
            <PackageCard
              key={servicePackage.id}
              servicePackage={servicePackage}
              revealDelay={index === 1 ? 80 : 0}
            />
          ))}
        </div>

        <Reveal delay={80}>
          <SupportBlock />
        </Reveal>

        <div className="pt-14 sm:pt-16 lg:pt-20">
          <SectionClosingStatement
            firstLine="Sie wissen noch nicht, welches Paket passt?"
            secondLine="Wir empfehlen Ihnen kostenlos die passende Lösung."
          />
        </div>
      </Container>
    </section>
  );
}

function PackageCard({
  revealDelay,
  servicePackage
}: {
  revealDelay: 0 | 80;
  servicePackage: ServicePackage;
}) {
  const isFeatured = servicePackage.featured;
  const cardStyle = isFeatured ? featuredCardStyle : undefined;

  return (
    <Reveal
      className={`h-full ${isFeatured ? "order-first md:order-none" : ""}`}
      delay={revealDelay}
    >
      <article
        className={`group flex h-full min-h-[32rem] min-w-0 flex-col rounded-lg border p-6 transition-[border-color,transform,box-shadow,background-color] duration-200 ease-out md:min-h-[34rem] ${
          isFeatured
            ? "shadow-[0_18px_46px_rgba(0,0,0,0.22)] motion-safe:lg:-translate-y-4 motion-safe:hover:lg:-translate-y-5"
            : "border-white/10 bg-[#101a2c] text-warm-white hover:border-premium-gold/45 hover:shadow-[0_18px_42px_rgba(0,0,0,0.18)] motion-safe:hover:-translate-y-1"
        }`}
        style={cardStyle}
        aria-label={
          isFeatured
            ? `${servicePackage.name}, empfohlenes Paket`
            : servicePackage.name
        }
      >
      <div className="flex min-h-16 min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
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
    </Reveal>
  );
}

function SupportBlock() {
  return (
    <article className="mt-8 rounded-lg border border-white/10 bg-[#101a2c] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.12)] sm:p-6 lg:p-7">
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
