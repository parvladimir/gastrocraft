import { ContactSection } from "@/components/sections/contact-section";
import { HeroSection } from "@/components/sections/hero-section";
import { PackagesSection } from "@/components/sections/packages-section";
import { ReferencesSection } from "@/components/sections/references-section";
import { SolutionsSection } from "@/components/sections/solutions-section";
import { WhyGastroCraftSection } from "@/components/sections/why-gastrocraft-section";

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
