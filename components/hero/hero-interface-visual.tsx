"use client";

import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

const serviceHints = [
  "Digitale Speisekarte",
  "Google sichtbar",
  "Direkt erreichbar"
];

export function HeroInterfaceVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisualInView, setIsVisualInView] = useState(false);
  const handleEnter = useCallback(() => setIsVisualInView(true), []);
  const ref = useInView<HTMLDivElement>({
    onEnter: handleEnter,
    threshold: 0.24
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!isVisualInView || mediaQuery.matches) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % serviceHints.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [isVisualInView]);

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full min-w-0 max-w-[34rem] lg:mx-0 lg:-mt-4"
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

          <div className="grid gap-4 p-4 sm:p-5">
            <div className="rounded-md border border-white/10 bg-[#111c31] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="h-2.5 w-24 rounded bg-premium-gold" />
                  <div className="mt-5 h-4 w-52 max-w-full rounded bg-warm-white/85" />
                  <div className="mt-3 h-3.5 w-40 max-w-[80%] rounded bg-white/28" />
                </div>
                <div className="hidden rounded border border-premium-gold/35 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-premium-gold sm:block">
                  Sichtbar
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className={`h-[4.5rem] overflow-hidden rounded border bg-[#172238] p-2 transition-colors duration-200 ease-out sm:p-3 ${
                      item === activeIndex
                        ? "border-premium-gold/55"
                        : "border-white/10"
                    }`}
                  >
                    <div
                      className={`h-2 w-10 rounded transition-colors duration-200 ${
                        item === activeIndex ? "bg-premium-gold" : "bg-white/35"
                      }`}
                    />
                    <div className="mt-3 h-2 w-14 rounded bg-white/20" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {serviceHints.map((label, index) => (
                <ServiceHint
                  key={label}
                  isActive={index === activeIndex}
                  label={label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-6 left-4 right-4 rounded-md border border-premium-gold/25 bg-[#101a2c] px-4 py-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] sm:left-6 sm:right-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warm-white">GastroCraft</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Digitale Präsenz für Restaurants
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-premium-gold/35 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-premium-gold">
              <Check className="h-3.5 w-3.5" />
              Bereit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceHint({
  isActive,
  label
}: {
  isActive: boolean;
  label: string;
}) {
  return (
    <div
      data-active={isActive ? "true" : "false"}
      className={`rounded-md border bg-[#101a2c] px-4 py-4 transition-[border-color,background-color] duration-200 ease-out ${
        isActive
          ? "border-premium-gold/60 bg-[#121f34]"
          : "border-white/10"
      }`}
    >
      <div
        className={`mb-4 inline-flex h-8 w-8 items-center justify-center rounded border transition-colors duration-200 ${
          isActive
            ? "border-premium-gold/70 text-premium-gold"
            : "border-premium-gold/35 text-premium-gold/80"
        }`}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </div>
      <p
        className={`text-sm font-semibold leading-5 transition-colors duration-200 ${
          isActive ? "text-warm-white" : "text-slate-200"
        }`}
      >
        {label}
      </p>
      <div className="mt-4 flex items-center text-premium-gold/80">
        <span className="h-px flex-1 bg-premium-gold/25" />
        <ArrowRight
          className={`ml-2 h-3.5 w-3.5 transition-transform duration-200 ${
            isActive ? "translate-x-0.5" : ""
          }`}
        />
      </div>
    </div>
  );
}
