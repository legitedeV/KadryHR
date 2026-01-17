"use client";

import { Children, ReactNode, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/components/motion/prefersReducedMotion";

type SectionScrollerProps = {
  children: ReactNode;
  className?: string;
};

export function SectionScroller({ children, className }: SectionScrollerProps) {
  const currentIndexRef = useRef(0);
  const lockRef = useRef(false);
  const sections = Children.toArray(children);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const widthTier =
        width < 768 ? "sm" :
          width < 1024 ? "md" :
            width < 1280 ? "lg" :
              width < 1536 ? "xl" : "2xl";
      const heightTier = height < 800 ? "short" : height < 950 ? "medium" : "tall";
      document.body.dataset.viewportWidth = widthTier;
      document.body.dataset.viewportHeight = heightTier;
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    if (prefersReducedMotion()) {
      return () => {
        window.removeEventListener("resize", updateViewport);
        delete document.body.dataset.viewportWidth;
        delete document.body.dataset.viewportHeight;
      };
    }
    if (!window.matchMedia("(pointer: fine)").matches) {
      return () => {
        window.removeEventListener("resize", updateViewport);
        delete document.body.dataset.viewportWidth;
        delete document.body.dataset.viewportHeight;
      };
    }

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
      window.removeEventListener("resize", updateViewport);
      observer.disconnect();
      delete document.body.dataset.landingScroll;
      delete document.body.dataset.viewportWidth;
      delete document.body.dataset.viewportHeight;
    };
  }, []);

  return (
    <main className={className ?? ""}>
      {sections}
    </main>
  );
}
