import type { Metadata } from "next";
import { ContactSection } from "@/components/sections/contact-section";
import { FaqSection } from "@/components/sections/faq-section";
import { HeroSection } from "@/components/sections/hero-section";
import { PackagesSection } from "@/components/sections/packages-section";
import { ReferencesSection } from "@/components/sections/references-section";
import { ServicesSection } from "@/components/sections/services-section";
import { SolutionsSection } from "@/components/sections/solutions-section";
import { WhyDinevioSection } from "@/components/sections/why-dinevio-section";
import { getAbsoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: {
    canonical: getAbsoluteUrl("/")
  },
  description:
    "DINEVIO entwickelt moderne Websites und digitale Lösungen für Restaurants, Cafés, Bars und Gastronomiebetriebe.",
  openGraph: {
    description:
      "DINEVIO entwickelt moderne Websites und digitale Lösungen für Restaurants, Cafés, Bars und Gastronomiebetriebe.",
    siteName: siteConfig.name,
    title: "DINEVIO | Websites und digitale Lösungen für Restaurants",
    url: getAbsoluteUrl("/")
  },
  title: {
    absolute: "DINEVIO | Websites und digitale Lösungen für Restaurants"
  },
  twitter: {
    description:
      "DINEVIO entwickelt moderne Websites und digitale Lösungen für Restaurants, Cafés, Bars und Gastronomiebetriebe.",
    title: "DINEVIO | Websites und digitale Lösungen für Restaurants"
  }
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      <ServicesSection />
      <ReferencesSection />
      <PackagesSection />
      <WhyDinevioSection />
      <FaqSection />
      <ContactSection />
    </>
  );
}
