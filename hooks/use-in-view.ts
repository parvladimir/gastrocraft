"use client";

import { useEffect, useState } from "react";

type UseInViewOptions = {
  onEnter: () => void;
  rootMargin?: string;
  threshold?: number;
};

export function useInView<TElement extends Element>({
  onEnter,
  rootMargin = "0px 0px -12% 0px",
  threshold = 0.16
}: UseInViewOptions) {
  const [element, setElement] = useState<TElement | null>(null);

  useEffect(() => {
    if (!element) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches || !("IntersectionObserver" in window)) {
      window.requestAnimationFrame(onEnter);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onEnter();
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, onEnter, rootMargin, threshold]);

  return setElement;
}
