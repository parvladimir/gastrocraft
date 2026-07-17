"use client";

import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import type { FaqItem } from "@/data/faq-items";

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openItemId, setOpenItemId] = useState(items[0]?.id ?? "");
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusButton = (index: number) => {
    buttonRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = buttonRefs.current.findIndex(
      (button) => button === event.currentTarget
    );

    if (currentIndex < 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusButton((currentIndex + 1) % items.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusButton((currentIndex - 1 + items.length) % items.length);
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusButton(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusButton(items.length - 1);
    }
  };

  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const isOpen = item.id === openItemId;
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-button-${item.id}`;

        return (
          <article
            key={item.id}
            className="rounded-lg border border-white/10 bg-[#101a2c] transition-[border-color,box-shadow] duration-200 ease-out hover:border-premium-gold/35 hover:shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
          >
            <h3>
              <button
                ref={(node) => {
                  buttonRefs.current[index] = node;
                }}
                id={buttonId}
                type="button"
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-5 rounded-lg px-5 py-5 text-left font-heading text-lg font-semibold leading-7 text-warm-white transition-colors duration-200 ease-out hover:text-premium-gold focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)] sm:px-6"
                onClick={() => setOpenItemId(item.id)}
                onKeyDown={handleKeyDown}
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-premium-gold transition-transform duration-200 ease-out ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.8}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="border-t border-white/10 px-5 pb-5 pt-4 text-base leading-7 text-slate-300 sm:px-6">
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
