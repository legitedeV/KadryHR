"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";

const defaultHighlights = [
  "Grafik i dyspozycyjność w jednej osi czasu.",
  "Czas pracy i urlopy bez ręcznych korekt.",
  "Decyzje operacyjne widoczne w czasie rzeczywistym.",
];

const defaultStats = [
  { value: "48%", label: "mniej interwencji" },
  { value: "1,8h", label: "zamknięcie miesiąca" },
  { value: "96%", label: "reakcji w 24h" },
];

export type HeroContent = {
  badgeLabel?: string;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  highlights?: string[];
  stats?: Array<{ value: string; label: string }>;
};

export function Hero({ content }: { content?: HeroContent }) {
  const [loaded] = useState(() => typeof window !== "undefined");

  const highlights = content?.highlights?.length
    ? content.highlights
    : defaultHighlights;
  const stats = content?.stats?.length ? content.stats : defaultStats;

  return (
    <section
      className="landing-section relative min-h-[92vh] overflow-hidden px-6 pb-24 pt-28 md:pt-36"
      id="produkt"
      data-hero-loaded={loaded}
    >
      <div className="absolute inset-0">
        <div className="hero-layer absolute inset-0" aria-hidden="true">
          <div className="hero-aurora" />
        </div>
        <div
          className="hero-layer floating-orb orb-slow -left-16 top-20 h-44 w-44 bg-brand-500/20"
          aria-hidden="true"
        />
        <div
          className="hero-layer floating-orb orb-fast right-10 top-32 h-28 w-28 bg-accent-400/20"
          aria-hidden="true"
        />
        <div className="hero-layer floating-orb -bottom-10 right-28 h-36 w-36 bg-accent-400/15" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-[1.15fr_0.85fr]">
        <Reveal className="relative z-10 space-y-8" delay={120} distance={22}>
          <div className="inline-flex items-center gap-3 rounded-full border border-surface-800/60 bg-surface-950/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-surface-300">
            <span className="h-2 w-2 rounded-full bg-brand-400" />
            {content?.badgeLabel ?? "KadryHR · Command for Workforce"}
          </div>

          <div className="space-y-6">
            <h1 className="hero-title text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-surface-50 md:text-5xl lg:text-[3.9rem]">
              {content?.title ?? (
                <>
                  Operacyjny spokój dla{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-brand-300 via-accent-300 to-brand-400 bg-clip-text text-transparent">
                      zespołów zmianowych
                    </span>
                    <span className="absolute -bottom-2 left-0 right-0 h-3 bg-brand-500/20 blur-lg" aria-hidden="true" />
                  </span>
                  .
                </>
              )}
            </h1>
            <p className="hero-lede max-w-xl text-lg leading-relaxed text-surface-300">
              {content?.subtitle ??
                "KadryHR synchronizuje grafik, czas pracy i decyzje urlopowe w jednym rytmie. Zespół wie, kto jest gdzie. Ty widzisz konsekwencje, zanim staną się problemem."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href={content?.primaryCtaUrl ?? "#kontakt"} className="btn-primary btn-hero group px-6 py-3 text-base">
              {content?.primaryCtaLabel ?? "Umów demo"}
              <span aria-hidden className="ml-1 transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link href={content?.secondaryCtaUrl ?? "#product-tour"} className="btn-secondary btn-hero-outline group px-6 py-3">
              {content?.secondaryCtaLabel ?? "Zobacz system"}
              <svg className="ml-2 h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-surface-800/50 pt-5">
            {stats.map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="text-2xl font-semibold text-brand-300">{stat.value}</span>
                <span className="text-sm text-surface-400">{stat.label}</span>
                {index < stats.length - 1 && (
                  <span className="hidden sm:block ml-3 h-8 w-px bg-surface-800" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-3 text-sm text-surface-300">
            {highlights.map((item, index) => (
              <Reveal key={item} delay={260 + index * 80} distance={16}>
                <div className="flex items-start gap-3 group">
                  <span className="mt-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-brand-700/50 bg-brand-950/40">
                    <svg className="h-3 w-3 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="transition-colors duration-500 group-hover:text-surface-200">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal className="relative z-10" delay={240} distance={26}>
          <div className="transition-transform duration-[900ms]">
            <div
              className="relative mx-auto max-w-md rounded-[34px] border border-white/[0.08] bg-gradient-to-b from-surface-900/85 to-surface-950/95 p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            >
              <div className="absolute -left-16 top-6 hidden h-40 w-40 rounded-full bg-brand-500/15 blur-3xl md:block" />
              <div className="absolute -right-16 bottom-6 hidden h-40 w-40 rounded-full bg-accent-500/15 blur-3xl md:block" />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-surface-400">Panel operacyjny</p>
                    <p className="mt-2 text-lg font-semibold text-surface-50">Widok zespołu w czasie rzeczywistym</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-brand-700/40 bg-brand-950/60 px-3 py-1.5 text-xs font-semibold text-brand-200">
                    Live
                  </span>
                </div>

                <div className="rounded-2xl border border-surface-700/40 bg-surface-900/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-surface-400">
                    <span className="font-medium">Region Gdańsk · 12 lokalizacji</span>
                    <span>Październik 2026</span>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-1.5 text-[10px]">
                    {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day, index) => (
                      <div key={day} className="text-center">
                        <span className="text-surface-500 font-medium">{day}</span>
                        <div
                          className={`mt-2 flex h-11 items-center justify-center rounded-lg border transition-all duration-500 ${
                            index % 2 === 0
                              ? "border-brand-700/30 bg-brand-900/40 text-brand-200"
                              : "border-surface-700/30 bg-surface-800/50 text-surface-300"
                          }`}
                        >
                          <span className="px-1 text-[9px] font-semibold">
                            {index % 2 === 0 ? "Pełna" : "3 luki"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-surface-700/40 bg-surface-800/45 p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-700/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-500">Dyspozycyjność</p>
                    <p className="mt-2 text-lg font-semibold text-surface-50">
                      96% <span className="text-xs font-normal text-surface-400">w 24h</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-surface-700/40 bg-surface-800/45 p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-700/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-500">Czas pracy</p>
                    <p className="mt-2 text-lg font-semibold text-surface-50">
                      1 klik <span className="text-xs font-normal text-surface-400">→ raport</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-800/30 bg-gradient-to-r from-brand-950/45 to-brand-900/20 p-4 text-sm text-brand-100">
                  „Zamknięcie miesiąca schodzi z całego dnia do dwóch godzin.”
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-surface-500">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll</span>
        <div className="h-10 w-6 rounded-full border border-surface-700/50 p-1">
          <div className="mx-auto h-2 w-1.5 rounded-full bg-brand-500" />
        </div>
      </div>
    </section>
  );
}
