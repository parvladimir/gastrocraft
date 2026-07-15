import { HeroSection } from "@/components/sections/hero-section";
import { ReferencesSection } from "@/components/sections/references-section";
import { SolutionsSection } from "@/components/sections/solutions-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      <section id="services" aria-label="Leistungen" className="h-px" />
      <ReferencesSection />
      <section id="packages" aria-label="Pakete" className="h-px" />
      <section id="about" aria-label="Über uns" className="h-px" />
      <section id="contact" aria-label="Kontakt" className="h-px" />
    </>
  );
}
