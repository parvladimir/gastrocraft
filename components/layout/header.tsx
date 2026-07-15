"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { label: "Lösungen", href: "#solutions" },
  { label: "Leistungen", href: "#services" },
  { label: "Referenzen", href: "#references" },
  { label: "Pakete", href: "#packages" },
  { label: "Über uns", href: "#about" },
  { label: "Kontakt", href: "#contact" }
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 8);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        isScrolled || isMenuOpen
          ? "border-white/10 bg-midnight"
          : "border-transparent bg-midnight/70 md:bg-midnight/30"
      }`}
    >
      <Container className="flex min-h-20 items-center justify-between gap-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-3 focus-visible:rounded-sm"
          aria-label="GastroCraft Startseite"
          onClick={closeMenu}
        >
          <Image
            src="/brand/gastrocraft-monogram.svg"
            alt=""
            width={42}
            height={42}
            priority
            aria-hidden="true"
            className="h-10 w-10"
          />
          <span className="inline-flex flex-col">
            <span className="font-heading text-xl font-semibold text-warm-white">
              GastroCraft
            </span>
            <span className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-premium-gold sm:inline">
              Restaurant Digital Solutions
            </span>
          </span>
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm text-sm font-medium text-slate-300 transition-colors hover:text-warm-white"
            >
              {item.label}
            </a>
          ))}
          <Button href="#contact" variant="primary" size="sm">
            Kostenlose Demo
          </Button>
        </nav>

        <button
          type="button"
          aria-label={isMenuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 text-warm-white transition-colors hover:border-premium-gold hover:text-premium-gold lg:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </Container>

      <div
        id="mobile-navigation"
        className={`lg:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <Container className="pb-6">
          <nav
            aria-label="Mobile Hauptnavigation"
            className="grid gap-2 border-t border-white/10 pt-5"
          >
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded px-1 py-3 text-base font-medium text-slate-200 transition-colors hover:text-premium-gold"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
            <Button
              href="#contact"
              variant="primary"
              className="mt-3 w-full"
              onClick={closeMenu}
            >
              Kostenlose Demo
            </Button>
          </nav>
        </Container>
      </div>
    </header>
  );
}
