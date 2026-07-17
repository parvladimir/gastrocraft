"use client";

import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { useInView } from "@/hooks/use-in-view";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 0 | 80 | 120 | 160 | 200;
};

const delayClasses: Record<NonNullable<RevealProps["delay"]>, string> = {
  0: "",
  80: "delay-[80ms]",
  120: "delay-[120ms]",
  160: "delay-[160ms]",
  200: "delay-[200ms]"
};

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const revealElement = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.dataset.revealState = "visible";
    }
  }, []);

  const inViewRef = useInView<HTMLDivElement>({ onEnter: revealElement });

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
      inViewRef(node);

      if (!node) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (node.dataset.revealState !== "visible") {
          node.dataset.revealReady = "true";
        }
      });
    },
    [inViewRef]
  );

  return (
    <div
      ref={setRef}
      data-reveal="true"
      data-reveal-state="hidden"
      className={`transition-[opacity,transform] duration-[560ms] ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 ${delayClasses[delay]} ${className}`}
    >
      {children}
    </div>
  );
}
