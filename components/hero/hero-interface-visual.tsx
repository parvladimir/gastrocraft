"use client";

import { ArrowRight, Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

type SolutionModule = {
  id: string;
  label: string;
  supportLabel: string;
};

const solutionModules: SolutionModule[] = [
  {
    id: "website",
    label: "Professionelle Website",
    supportLabel: "Moderner Auftritt"
  },
  {
    id: "menu",
    label: "Digitale Speisekarte",
    supportLabel: "Mobil verfügbar"
  },
  {
    id: "visibility",
    label: "Google & Kontakt",
    supportLabel: "Direkt gefunden"
  }
];

const processSteps = ["Website", "Speisekarte", "Kontakt"];

export function HeroInterfaceVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisualInView, setIsVisualInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const handleEnter = useCallback(() => setIsVisualInView(true), []);
  const ref = useInView<HTMLDivElement>({
    onEnter: handleEnter,
    threshold: 0.24
  });
  const completedModules = useMemo(
    () => (prefersReducedMotion ? solutionModules.map((module) => module.id) : []),
    [prefersReducedMotion]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (!isVisualInView || prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveIndex((current) => (current + 1) % solutionModules.length);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isVisualInView, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full min-w-0 max-w-[34rem] lg:mx-0 lg:-mt-3 xl:max-w-[35rem]"
      aria-hidden="true"
    >
      <div className="absolute -left-5 top-12 hidden h-32 w-28 rounded-lg border border-premium-gold/25 bg-midnight/60 sm:block" />
      <div className="absolute -right-4 bottom-16 hidden h-24 w-24 rounded-lg border border-white/10 bg-[#101a2c] sm:block" />

      <div className="relative rounded-lg border border-white/12 bg-[#111c31] p-3.5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-4">
        <div className="rounded-md border border-white/10 bg-midnight">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-premium-gold" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-gray" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            <span className="ml-3 h-7 flex-1 rounded border border-white/10 bg-[#111c31]" />
          </div>

          <div className="grid gap-3.5 p-4 sm:p-5">
            <div className="rounded-md border border-white/10 bg-[#111c31] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex rounded border border-premium-gold/35 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-premium-gold">
                    Digitale Lösung
                  </div>
                  <div className="mt-4 h-3.5 w-48 max-w-full rounded bg-warm-white/85" />
                  <div className="mt-3 h-3 w-36 max-w-[80%] rounded bg-white/28" />
                </div>
              </div>

              <div className="mt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {solutionModules.map((module, index) => (
                    <SolutionModuleCard
                      key={module.id}
                      index={index}
                      isActive={prefersReducedMotion || index === activeIndex}
                      isComplete={completedModules.includes(module.id)}
                      module={module}
                    />
                  ))}
                </div>

                <div className="mt-4 hidden items-center justify-center gap-2 px-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] sm:flex">
                  {processSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-2">
                      <span
                        className={`transition-colors duration-200 ${
                          prefersReducedMotion || index <= activeIndex
                            ? "text-premium-gold"
                            : "text-slate-500"
                        }`}
                      >
                        {step}
                      </span>
                      {index < processSteps.length - 1 ? (
                        <ArrowRight
                          className={`h-3.5 w-3.5 shrink-0 transition-colors duration-200 ${
                            prefersReducedMotion || index < activeIndex
                              ? "text-premium-gold"
                              : "text-slate-500"
                          }`}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-premium-gold/30 bg-[#101a2c] p-4">
              <p className="font-heading text-lg font-semibold leading-6 text-warm-white">
                Mehr Sichtbarkeit.
                <span className="block text-premium-gold">
                  Weniger Umwege für Ihre Gäste.
                </span>
              </p>
              <p className="mt-2.5 text-sm leading-6 text-slate-400">
                Alle wichtigen Informationen an einem Ort.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-3 rounded-md border border-premium-gold/25 bg-[#101a2c] px-4 py-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] sm:absolute sm:-bottom-6 sm:left-6 sm:right-6 sm:mt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warm-white">DINEVIO</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Digitaler Auftritt verbunden
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-premium-gold/35 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-premium-gold">
              <Check className="h-3.5 w-3.5" />
              Online bereit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionModuleCard({
  index,
  isActive,
  isComplete,
  module
}: {
  index: number;
  isActive: boolean;
  isComplete: boolean;
  module: SolutionModule;
}) {
  return (
    <div
      data-active={isActive ? "true" : "false"}
      className={`relative min-h-[7rem] rounded-md border bg-[#172238] p-3.5 transition-[border-color,background-color] duration-200 ease-out sm:min-h-[7.5rem] ${
        isActive
          ? "border-premium-gold/70 bg-[#121f34]"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`font-heading text-xs font-semibold tracking-[0.16em] transition-colors duration-200 ${
            isActive ? "text-premium-gold" : "text-slate-500"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={`h-2 w-2 rounded-full transition-colors duration-200 ${
            isActive || isComplete ? "bg-premium-gold" : "bg-white/25"
          }`}
        />
      </div>
      <p
        className={`mt-4 text-sm font-semibold leading-5 transition-colors duration-200 ${
          isActive ? "text-warm-white" : "text-slate-200"
        }`}
      >
        {module.label}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{module.supportLabel}</p>
    </div>
  );
}
