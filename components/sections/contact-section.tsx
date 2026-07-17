import { MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionClosingStatement } from "@/components/ui/section-closing-statement";
import {
  contactPeople,
  type ContactAction,
  type ContactPerson
} from "@/data/contact-details";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-white/10 py-20 sm:py-24 lg:py-28"
      aria-labelledby="contact-heading"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold sm:text-sm">
              Kostenlose Erstberatung
            </p>
            <h2
              id="contact-heading"
              className="mt-5 font-heading text-3xl font-semibold leading-tight text-warm-white sm:text-5xl"
            >
              Lassen Sie uns über Ihr Restaurant sprechen.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Erzählen Sie uns kurz von Ihrem Betrieb. Wir zeigen Ihnen
              unverbindlich, welche digitale Lösung sinnvoll ist und wie ein
              moderner Auftritt für Ihr Restaurant aussehen könnte.
            </p>
            <p className="mt-7 inline-flex items-center gap-3 text-sm font-medium leading-6 text-slate-400">
              <span className="h-px w-8 shrink-0 bg-premium-gold" aria-hidden="true" />
              Unverbindlich. Persönlich. Ohne komplizierte Vorbereitung.
            </p>

            <div className="mt-10 grid gap-4">
              {contactPeople.map((person, index) => (
                <Reveal key={person.name} delay={index === 0 ? 0 : 80}>
                  <ContactCard person={person} />
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <ContactForm />
          </Reveal>
        </div>

        <div className="pt-14 sm:pt-16 lg:pt-20">
          <SectionClosingStatement
            firstLine="Der erste Schritt ist ganz einfach."
            secondLine="Ein kurzes Gespräch reicht."
          />
        </div>
      </Container>
    </section>
  );
}

function ContactCard({ person }: { person: ContactPerson }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#101a2c] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.12)] transition-[border-color,transform,box-shadow] duration-200 ease-out hover:border-premium-gold/40 hover:shadow-[0_18px_42px_rgba(0,0,0,0.18)] motion-safe:hover:-translate-y-0.5">
      <div>
        <h3 className="font-heading text-xl font-semibold text-warm-white">
          {person.name}
        </h3>
        <p className="mt-1 text-sm text-slate-400">{person.role}</p>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-slate-300">
        {person.actions.map((action) => (
          <div key={action.value} className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="text-slate-500">
              {action.type === "phone" ? "Telefon:" : "WhatsApp:"}
            </dt>
            <dd>{action.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {person.actions.map((action) => (
          <ContactActionLink key={action.href} action={action} />
        ))}
      </div>
    </article>
  );
}

function ContactActionLink({ action }: { action: ContactAction }) {
  const Icon = action.type === "phone" ? Phone : MessageCircle;
  const isExternal = action.type === "whatsapp";

  return (
    <a
      href={action.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={action.ariaLabel}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-premium-gold/65 px-4 text-sm font-semibold text-premium-gold transition-[background-color,border-color,transform] duration-200 ease-out hover:border-premium-gold hover:bg-premium-gold/8 active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)] sm:flex-1"
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
      {action.label}
    </a>
  );
}
