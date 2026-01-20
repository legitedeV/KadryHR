"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { prefersReducedMotion } from "@/components/motion/prefersReducedMotion";

const defaultHighlights = [
  "Grafiki miesięczne z dyspozycyjnością w jednym widoku",
  "Rejestracja czasu pracy QR + automatyczne raporty",
  "Panel pracownika i managera z jasnymi przepływami",
];

const defaultStats = [
  { value: "42%", label: "mniej konfliktów" },
  { value: "2h", label: "zamknięcie miesiąca" },
  { value: "92%", label: "odpowiedzi w 24h" },
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
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const auroraRef = useRef<HTMLDivElement | null>(null);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const mockupRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      // Use requestAnimationFrame to batch with browser paint
      requestAnimationFrame(() => setLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let frame = 0;
    const handleScroll = () => {
      const offset = Math.min(window.scrollY, 800);
      if (auroraRef.current) {
        auroraRef.current.style.transform = `translate3d(0, ${offset * 0.08}px, 0)`;
      }
      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(0, ${offset * -0.05}px, 0)`;
      }
      if (mockupRef.current) {
        mockupRef.current.style.transform = `translate3d(0, ${offset * -0.06}px, 0)`;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        handleScroll();
      });
    };

    handleScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const highlights = content?.highlights?.length
    ? content.highlights
    : defaultHighlights;
  const stats = content?.stats?.length ? content.stats : defaultStats;

  return (
    <section
      ref={heroRef}
      className="landing-section relative min-h-[92vh] overflow-hidden px-6 pb-20 pt-24 md:pt-32"
      id="produkt"
      data-hero-loaded={loaded}
    >
      {/* Enhanced background with more visual depth */}
      <div className="absolute inset-0">
        <div ref={auroraRef} className="hero-layer absolute inset-0" aria-hidden="true">
          <div className="hero-aurora" />
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="hero-layer absolute inset-0 opacity-[0.03]" 
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Floating orbs with interactive movement */}
        <div 
          className="hero-layer floating-orb orb-slow -left-10 top-16 h-40 w-40 bg-brand-500/25" 
          aria-hidden="true"
          style={{
            transform: `translate3d(${mousePosition.x * 20}px, ${mousePosition.y * 20}px, 0)`,
          }}
        />
        <div 
          ref={orbRef} 
          className="hero-layer floating-orb orb-fast right-12 top-28 h-24 w-24 bg-emerald-400/25" 
          aria-hidden="true"
          style={{
            transform: `translate3d(${mousePosition.x * -15}px, ${mousePosition.y * -15}px, 0)`,
          }}
        />
        <div 
          className="hero-layer floating-orb -bottom-8 right-28 h-32 w-32 bg-cyan-400/20" 
          aria-hidden="true" 
        />
        <div 
          className="hero-layer floating-orb orb-slow left-1/3 bottom-20 h-20 w-20 bg-purple-400/15" 
          aria-hidden="true" 
        />
        <div className="noise-overlay" aria-hidden="true" />
        
        {/* Radial gradient spotlight */}
        <div 
          className="hero-layer absolute pointer-events-none"
          aria-hidden="true"
          style={{
            background: `radial-gradient(800px circle at ${50 + mousePosition.x * 30}% ${50 + mousePosition.y * 30}%, rgba(34, 197, 94, 0.08), transparent 50%)`,
            inset: 0,
          }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-[1.15fr_0.85fr]">
        <Reveal className="relative z-10 space-y-8" delay={120} distance={24}>
          {/* Badge with pulse animation */}
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-950/50 px-4 py-2 text-xs font-semibold text-brand-200 ring-1 ring-brand-700/40 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
            </span>
            {content?.badgeLabel ?? "KadryHR dla retail i zespołów zmianowych"}
          </div>
          
          <div className="space-y-6">
            <h1 className="hero-title text-4xl font-bold leading-[1.1] tracking-tight text-surface-50 md:text-5xl lg:text-[3.5rem]">
              {content?.title ?? (
                <>
                  Grafiki, czas pracy i urlopy{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-brand-300 via-emerald-300 to-brand-400 bg-clip-text text-transparent">
                      domknięte
                    </span>
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-3 bg-brand-500/20 blur-lg"
                      aria-hidden="true"
                    />
                  </span>{" "}
                  w jednym, przewidywalnym rytmie.
                </>
              )}
            </h1>
            <p className="hero-lede max-w-xl text-lg leading-relaxed text-surface-300">
              {content?.subtitle ??
                "KadryHR porządkuje grafikowanie w sklepach i sieciach usługowych: mniej telefonów, mniej kolizji, szybsze rozliczenia i stały wgląd w obsadę na każdej zmianie."}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={content?.primaryCtaUrl ?? "#kontakt"}
              className="btn-primary btn-hero group px-6 py-3 text-base"
            >
              {content?.primaryCtaLabel ?? "Umów demo"}
              <span aria-hidden className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href={content?.secondaryCtaUrl ?? "#product-tour"}
              className="btn-secondary btn-hero-outline group px-6 py-3"
            >
              {content?.secondaryCtaLabel ?? "Zobacz jak działa"}
              <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
          
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-surface-800/50">
            {stats.map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-brand-400">{stat.value}</span>
                <span className="text-sm text-surface-400">{stat.label}</span>
                {index < stats.length - 1 && (
                  <span className="hidden sm:block ml-3 h-8 w-px bg-surface-800" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          
          {/* Feature highlights */}
          <div className="grid gap-3 text-sm text-surface-300">
            {highlights.map((item, index) => (
              <Reveal key={item} delay={280 + index * 60} distance={16}>
                <div className="flex items-start gap-3 group">
                  <span className="mt-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-900/50 ring-1 ring-brand-700/50 transition-all group-hover:bg-brand-800/60 group-hover:ring-brand-600/60">
                    <svg className="h-3 w-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="transition-colors group-hover:text-surface-200">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
        
        {/* Enhanced mockup */}
        <Reveal className="relative z-10" delay={240} distance={28}>
          <div ref={mockupRef} className="transition-transform duration-500">
            <div 
              className="relative mx-auto max-w-md rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-surface-900/80 to-surface-950/90 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(16,185,129,0.15)]"
              style={{
                transform: `perspective(1000px) rotateY(${mousePosition.x * 3}deg) rotateX(${mousePosition.y * -3}deg)`,
              }}
            >
              {/* Glow effects */}
              <div className="absolute -left-16 top-8 hidden h-40 w-40 rounded-full bg-brand-600/20 blur-3xl md:block" />
              <div className="absolute -right-16 bottom-8 hidden h-40 w-40 rounded-full bg-emerald-600/15 blur-3xl md:block" />
              
              {/* Card content */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-300">Panel managera</p>
                    <p className="mt-1 text-lg font-semibold text-surface-50">
                      Widzisz cały miesiąc w 2 minuty
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-brand-950/60 px-3 py-1.5 text-xs font-semibold text-brand-200 ring-1 ring-brand-700/40">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Live
                  </span>
                </div>
                
                {/* Calendar mockup */}
                <div className="rounded-2xl border border-surface-700/50 bg-surface-900/90 p-4 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-surface-400">
                    <span className="font-medium">Sklep Gdańsk Wrzeszcz</span>
                    <span>Październik 2026</span>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-1.5 text-[10px]">
                    {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day, index) => (
                      <div key={day} className="text-center">
                        <span className="text-surface-500 font-medium">{day}</span>
                        <div 
                          className={`mt-2 h-11 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            index % 2 === 0 
                              ? "bg-brand-900/50 border border-brand-700/30 hover:bg-brand-800/50" 
                              : "bg-surface-800/60 border border-surface-700/30 hover:bg-surface-700/60"
                          }`}
                        >
                          <span className={`text-[9px] font-semibold px-1 ${index % 2 === 0 ? "text-brand-200" : "text-surface-300"}`}>
                            {index % 2 === 0 ? "Pełna" : "3 luki"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Stats cards */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-surface-700/50 bg-surface-800/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-surface-800/70 hover:border-brand-700/30">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                      Dyspozycyjność
                    </p>
                    <p className="mt-2 text-lg font-bold text-surface-50">
                      92% <span className="text-sm font-normal text-surface-400">w 24h</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-surface-700/50 bg-surface-800/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-surface-800/70 hover:border-brand-700/30">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                      Czas pracy
                    </p>
                    <p className="mt-2 text-lg font-bold text-surface-50">
                      1 klik <span className="text-sm font-normal text-surface-400">→ raport</span>
                    </p>
                  </div>
                </div>
                
                {/* Quote */}
                <div className="rounded-2xl border border-brand-800/40 bg-gradient-to-r from-brand-950/50 to-brand-900/30 p-4 text-sm text-brand-100 transition-all duration-300 hover:-translate-y-1">
                  <svg className="mb-2 h-4 w-4 text-brand-500/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  Zamknięcie miesiąca zajmuje nam teraz 2 godziny zamiast całego dnia.
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative SVG */}
          <svg
            className="pointer-events-none absolute -bottom-12 -right-24 hidden w-[360px] opacity-50 md:block"
            viewBox="0 0 400 400"
            aria-hidden="true"
          >
            <g className="topo-lines" fill="none" stroke="rgba(16, 124, 87, 0.3)" strokeWidth="1">
              <path d="M10 80 C120 40, 180 120, 300 80" />
              <path d="M20 130 C140 90, 200 170, 320 130" />
              <path d="M30 180 C160 140, 220 220, 340 180" />
              <path d="M40 230 C180 190, 240 270, 360 230" />
              <path d="M50 280 C200 240, 260 320, 380 280" />
            </g>
          </svg>
        </Reveal>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-surface-500">
        <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
        <div className="h-10 w-6 rounded-full border-2 border-surface-700/50 p-1">
          <div className="h-2 w-1.5 mx-auto rounded-full bg-brand-500 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
