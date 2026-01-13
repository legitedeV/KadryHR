"use client";

import { ReactNode, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/components/motion/prefersReducedMotion";

type SectionScrollerProps = {
  children: ReactNode;
  className?: string;
};

export function SectionScroller({ children, className }: SectionScrollerProps) {
  const currentIndexRef = useRef(0);
  const lockRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>(".landing-section"));
    if (sections.length === 0) return;

    document.body.dataset.landingScroll = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sections.indexOf(entry.target as HTMLElement);
            if (index >= 0) currentIndexRef.current = index;
          }
        });
      },
      { threshold: 0.6 },
    );

    sections.forEach((section) => observer.observe(section));

    const handleWheel = (event: WheelEvent) => {
      if (lockRef.current) return;
      const delta = event.deltaY;
      if (Math.abs(delta) < 12) return;
      const nextIndex = delta > 0
        ? Math.min(currentIndexRef.current + 1, sections.length - 1)
        : Math.max(currentIndexRef.current - 1, 0);

      if (nextIndex === currentIndexRef.current) return;
      event.preventDefault();
      lockRef.current = true;
      currentIndexRef.current = nextIndex;
      sections[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        lockRef.current = false;
      }, 900);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      observer.disconnect();
      delete document.body.dataset.landingScroll;
    };
  }, []);

  return (
    <main className={className ?? ""}>
      {children}
    </main>
  );
}
