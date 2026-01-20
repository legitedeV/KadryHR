"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { prefersReducedMotion } from "@/components/motion/prefersReducedMotion";

const steps = [
  {
    title: "Dyspozycyjność na czas",
    desc: "Zamykasz okna dostępności z wyprzedzeniem. KadryHR pokazuje braki i nadmiary zanim zaczniesz układać grafik.",
    bullets: ["Automatyczne przypomnienia", "Okna czasowe", "Podgląd braków na zmianach"],
  },
  {
    title: "Budowanie grafiku w jednym widoku",
    desc: "Przeciągasz zmiany, kontrolujesz normy i widzisz obsadę w czasie rzeczywistym – bez Excela.",
    bullets: ["Szablony zmian", "Walidacja norm", "Szybkie kopiowanie tygodni"],
  },
  {
    title: "Urlopy i zastępstwa",
    desc: "Wnioski urlopowe i zamiany zmian są zatwierdzane w panelu, a Ty zawsze widzisz skutki dla obsady.",
    bullets: ["Zastępstwa jednym kliknięciem", "Historia decyzji", "Powiadomienia do zespołu"],
  },
  {
    title: "RCP i raporty",
    desc: "Rejestracja czasu pracy (QR/kiosk) oraz raporty godzinowe gotowe dla księgowości.",
    bullets: ["QR i zamykanie sesji", "Eksport do kadr i płac", "Anomalie w godzinach"],
  },
];

export function ProductTour() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionsRef = useRef<Array<HTMLDivElement | null>>([]);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    if (reducedMotion) return;
    const observers: IntersectionObserver[] = [];
    sectionsRef.current.forEach((section, index) => {
      if (!section) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0.1 },
      );
      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [reducedMotion]);

  const activeStep = useMemo(() => steps[activeIndex], [activeIndex]);

  return (
    <section className="landing-section border-t border-surface-900/70 px-6 py-28" id="product-tour">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 md:grid md:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="space-y-5" delay={80} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Product tour</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              Story-mode: od dyspozycyjności do raportu.
            </h2>
            <p className="text-surface-300">
              Przewiń, aby zobaczyć jak KadryHR prowadzi managera przez cały cykl miesiąca.
            </p>
            <div className="rounded-[28px] border border-surface-800/60 bg-surface-900/60 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] backdrop-blur transition-transform duration-500 hover:-translate-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">Aktualny krok</p>
              <h3 className="mt-3 text-xl font-semibold text-surface-50">
                {activeStep.title}
              </h3>
              <p className="mt-3 text-sm text-surface-300">
                {activeStep.desc}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeStep.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="rounded-full border border-brand-800/50 bg-brand-950/30 px-3 py-1 text-xs font-semibold text-brand-200"
                  >
                    {bullet}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="relative">
            <div className="sticky top-28 space-y-6">
              {steps.map((step, index) => (
                <Reveal
                  key={step.title}
                  delay={120 + index * 70}
                >
                  <div
                    ref={(node) => {
                      sectionsRef.current[index] = node;
                    }}
                    className={`rounded-[28px] border px-6 py-5 transition-all duration-500 hover:-translate-y-0.5 ${
                      index === activeIndex
                        ? "border-brand-800/60 bg-surface-900/80 shadow-soft"
                        : "border-surface-800/50 bg-surface-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-surface-500">
                          Krok {index + 1}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold text-surface-50">
                          {step.title}
                        </h4>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        index === activeIndex
                          ? "bg-brand-600 text-white"
                          : "bg-surface-800 text-surface-300"
                      }`}>
                        {index === activeIndex ? "Aktywne" : "Kolejny"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-surface-300">
                      {step.desc}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-surface-400">
                      {step.bullets.map((bullet) => (
                        <span key={bullet} className="rounded-full bg-surface-800/60 px-2 py-1 text-center">
                          {bullet}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
