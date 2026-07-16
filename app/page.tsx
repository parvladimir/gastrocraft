import type { Metadata } from "next";
import { ContactSection } from "@/components/sections/contact-section";
import { HeroSection } from "@/components/sections/hero-section";
import { PackagesSection } from "@/components/sections/packages-section";
import { ReferencesSection } from "@/components/sections/references-section";
import { SolutionsSection } from "@/components/sections/solutions-section";
import { WhyGastroCraftSection } from "@/components/sections/why-gastrocraft-section";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  },
  description:
    "Moderne Restaurant-Websites, digitale Speisekarten, QR-Lösungen, Google-Optimierung und persönliche Betreuung für Gastronomiebetriebe.",
  title: "Digitale Lösungen für Restaurants"
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      <section id="services" aria-label="Leistungen" className="h-px" />
      <ReferencesSection />
      <PackagesSection />
      <WhyGastroCraftSection />
      <ContactSection />
    </>
  );
}
