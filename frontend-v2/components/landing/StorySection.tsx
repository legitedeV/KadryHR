"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { prefersReducedMotion } from "@/components/motion/prefersReducedMotion";

const steps = [
  {
    title: "Zbierasz dyspozycyjność w jeden dzień",
    description:
      "Zespół uzupełnia dyspozycyjność w panelu pracownika, a manager od razu widzi ograniczenia i preferencje.",
    highlight: "Dyspozycyjność",
    stat: "92% odpowiedzi w 24h",
  },
  {
    title: "Układasz grafik z gotowych szablonów",
    description:
      "KadryHR podpowiada obsadę na podstawie norm i historii sprzedaży. Zostają tylko decyzje, nie ręczne kopiowanie.",
    highlight: "Grafik",
    stat: "2 minuty do wstępnego planu",
  },
  {
    title: "Rozliczasz czas pracy jednym kliknięciem",
    description:
      "RCP z QR oraz kiosk łączą się z godzinami w grafiku. Zespół HR dostaje gotowy raport do płac.",
    highlight: "RCP + raporty",
    stat: "−35% czasu na zamknięcie miesiąca",
  },
];

export function StorySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    if (reducedMotion) return;
    const observers = refs.current.map((node, index) => {
      if (!node) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { threshold: 0.6 },
      );
      observer.observe(node);
      return observer;
    });
    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [reducedMotion]);

  return (
    <section className="landing-section border-t border-surface-200/70 px-6 py-24 dark:border-surface-900/80" id="story">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl space-y-4" delay={80} distance={18}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-500 dark:text-surface-400">Historia wdrożenia</p>
          <h2 className="text-3xl font-semibold text-surface-900 md:text-4xl dark:text-surface-50">
            Przejdź od chaosu do spójnego, przewidywalnego rytmu w trzy kroki.
          </h2>
          <p className="text-surface-600 dark:text-surface-300">
            Zamiast wielu narzędzi i arkuszy, każdy etap pracy ma jedno miejsce. Sekcja poniżej pokazuje,
            jak KadryHR prowadzi managera od dyspozycyjności do rozliczeń.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                className={`rounded-3xl border px-6 py-5 transition-all hover:-translate-y-1 ${
                  activeIndex === index
                    ? "border-brand-300/70 bg-white/90 shadow-[0_20px_50px_rgba(16,185,129,0.12)] dark:border-brand-700/60 dark:bg-surface-900/70 dark:shadow-[0_20px_50px_rgba(16,185,129,0.18)]"
                    : "border-surface-200/70 bg-white/70 dark:border-surface-800/70 dark:bg-surface-950/60"
                }`}
              >
                <Reveal className="space-y-3" delay={140 + index * 80} distance={16}>
                  <div className="flex items-center gap-3 text-xs font-semibold text-brand-700 dark:text-brand-200">
                    <span className="rounded-full bg-brand-100/70 px-3 py-1 dark:bg-brand-950/40">{step.highlight}</span>
                    <span className="text-surface-500 dark:text-surface-400">Krok {index + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">{step.title}</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-300">{step.description}</p>
                  <div className="rounded-2xl border border-surface-200/70 bg-surface-50/80 px-4 py-3 text-sm text-surface-700 dark:border-surface-800/60 dark:bg-surface-900/60 dark:text-surface-200">
                    {step.stat}
                  </div>
                </Reveal>
              </div>
            ))}
          </div>

          <Reveal className="relative overflow-hidden rounded-[32px] border border-surface-200/70 bg-white/80 p-8 dark:border-surface-800/70 dark:bg-surface-900/60" delay={180} distance={20}>
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-200/60 blur-3xl dark:bg-brand-900/40" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-900/40" aria-hidden="true" />
            <div className="relative space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-500 dark:text-surface-400">
                Podgląd w czasie rzeczywistym
              </p>
              <div className="rounded-3xl border border-surface-200/70 bg-surface-50/80 p-5 dark:border-surface-800/70 dark:bg-surface-950/70">
                <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                  <span>Aktualny etap</span>
                  <span>{steps[activeIndex].highlight}</span>
                </div>
                <h4 className="mt-3 text-xl font-semibold text-surface-900 dark:text-surface-50">{steps[activeIndex].title}</h4>
                <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">{steps[activeIndex].description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div
                    key={step.highlight}
                    className={`rounded-2xl border px-4 py-3 text-sm transition-all ${
                      activeIndex === index
                        ? "border-brand-300/70 bg-brand-50/80 text-brand-700 dark:border-brand-700/60 dark:bg-brand-950/40 dark:text-brand-100"
                        : "border-surface-200/70 bg-surface-50/80 text-surface-600 dark:border-surface-800/70 dark:bg-surface-950/40 dark:text-surface-400"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em]">{step.highlight}</p>
                    <p className="mt-2 text-sm font-semibold">{step.stat}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
