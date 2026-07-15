import { HeroSection } from "@/components/sections/hero-section";
import { SolutionsSection } from "@/components/sections/solutions-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      <section id="services" aria-label="Leistungen" className="h-px" />
      <section id="references" aria-label="Referenzen" className="h-px" />
      <section id="packages" aria-label="Pakete" className="h-px" />
      <section id="about" aria-label="Über uns" className="h-px" />
      <section id="contact" aria-label="Kontakt" className="h-px" />
    </>
  );
}
