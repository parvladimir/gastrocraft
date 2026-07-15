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
      setIsScrolled(window.scrollY > 10);
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
      className={`sticky top-0 z-50 border-b backdrop-blur-sm transition-[background-color,border-color] duration-200 ${
        isScrolled || isMenuOpen
          ? "border-white/10 bg-midnight/95"
          : "border-transparent bg-midnight/80 lg:bg-midnight/55"
      }`}
    >
      <Container className="flex min-h-16 items-center justify-between gap-5 py-3 sm:min-h-[4.5rem]">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-2.5 focus-visible:rounded-sm sm:gap-3"
          aria-label="GastroCraft Startseite"
          onClick={closeMenu}
        >
          <Image
            src="/brand/gastrocraft-monogram.svg"
            alt=""
            width={38}
            height={38}
            priority
            aria-hidden="true"
            className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
          />
          <span className="inline-flex min-w-0 flex-col">
            <span className="font-heading text-lg font-semibold leading-tight text-warm-white sm:text-xl">
              GastroCraft
            </span>
            <span className="hidden text-[0.64rem] font-semibold uppercase leading-none tracking-[0.18em] text-premium-gold sm:mt-1 sm:inline">
              Restaurant Digital Solutions
            </span>
          </span>
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="hidden items-center gap-5 xl:flex xl:gap-6"
        >
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm px-0.5 py-2 text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-warm-white"
            >
              {item.label}
            </a>
          ))}
          <Button href="#contact" variant="primary" size="sm" className="ml-1">
            Kostenlose Demo
          </Button>
        </nav>

        <button
          type="button"
          aria-label={isMenuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 text-warm-white transition-colors duration-200 hover:border-premium-gold hover:text-premium-gold xl:hidden"
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
        className={`xl:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <Container className="pb-5">
          <nav
            aria-label="Mobile Hauptnavigation"
            className="grid gap-1 border-t border-white/10 pt-4"
          >
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded px-1 py-3 text-base font-medium text-slate-200 transition-colors duration-200 hover:text-premium-gold"
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
