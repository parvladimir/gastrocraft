import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { contactPeople } from "@/data/contact-details";

const footerNavigation = [
  { href: "#solutions", label: "Lösungen" },
  { href: "#services", label: "Leistungen" },
  { href: "#references", label: "Referenzen" },
  { href: "#packages", label: "Pakete" },
  { href: "#about", label: "Über uns" },
  { href: "#contact", label: "Kontakt" }
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" }
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0c1424]">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.9fr_0.7fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 focus-visible:rounded-sm"
              aria-label="GastroCraft Startseite"
            >
              <Image
                src="/brand/gastrocraft-monogram.svg"
                alt=""
                width={40}
                height={40}
                aria-hidden="true"
                className="h-10 w-10"
              />
              <span className="inline-flex flex-col">
                <span className="font-heading text-xl font-semibold text-warm-white">
                  GastroCraft
                </span>
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-premium-gold">
                  Restaurant Digital Solutions
                </span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">
              Ihre Gäste suchen online. Wir sorgen dafür, dass sie Sie finden.
            </p>
          </div>

          <FooterColumn title="Navigation">
            <ul className="grid gap-3">
              {footerNavigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-premium-gold"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Kontakt">
            <div className="grid gap-5">
              {contactPeople.map((contact) => (
                <div key={contact.name}>
                  <p className="font-semibold text-warm-white">{contact.name}</p>
                  <div className="mt-2 grid gap-1.5">
                    {contact.actions.map((action) => (
                      <a
                        key={action.href}
                        href={action.href}
                        target={action.type === "whatsapp" ? "_blank" : undefined}
                        rel={
                          action.type === "whatsapp"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        aria-label={action.ariaLabel}
                        className="text-sm text-slate-400 transition-colors duration-200 hover:text-premium-gold"
                      >
                        {action.type === "phone"
                          ? action.value
                          : `WhatsApp: ${action.value}`}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FooterColumn>

          <FooterColumn title="Rechtliches">
            <ul className="grid gap-3">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-premium-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} GastroCraft</p>
          <p>Restaurant Digital Solutions</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div>
      <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-premium-gold">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}
