"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "./prefersReducedMotion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
  distance?: number;
  duration?: number;
  scale?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  distance = 16,
  duration = 700,
  scale = 0.98,
}: RevealProps) {
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();
  const [visible, setVisible] = useState(() => reducedMotion);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isReduced = prefersReducedMotion();
    if (isReduced) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once]);

  const style = useMemo(
    () =>
      ({
        "--reveal-delay": `${delay}ms`,
        "--reveal-distance": `${distance}px`,
        "--reveal-duration": `${duration}ms`,
        "--reveal-scale": scale,
      }) as React.CSSProperties,
    [delay, distance, duration, scale],
  );

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className ?? ""}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
