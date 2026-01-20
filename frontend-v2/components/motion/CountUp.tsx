"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./prefersReducedMotion";

type CountUpProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

export function CountUp({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(() => reducedMotion ? value : 0);
  const hasAnimatedRef = useRef(reducedMotion);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // Show immediate value if reduced motion is preferred
    if (prefersReducedMotion()) {
      hasAnimatedRef.current = true;
      requestAnimationFrame(() => setDisplayValue(value));
      return;
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      hasAnimatedRef.current = true;
      requestAnimationFrame(() => setDisplayValue(value));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return;
        
        hasAnimatedRef.current = true;
        const start = performance.now();

        const animate = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          setDisplayValue(Math.round(value * eased * 100) / 100);
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setDisplayValue(value);
          }
        };

        requestAnimationFrame(animate);
      },
      { threshold: 0.3 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [duration, value]);

  const formatted = (() => {
    const formatter = new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(Math.round(displayValue));
  })();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
