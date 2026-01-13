import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

const highlights = [
  "Grafiki miesięczne z dyspozycyjnością w jednym widoku",
  "Rejestracja czasu pracy QR + automatyczne raporty",
  "Panel pracownika i managera z jasnymi przepływami",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-20 md:pt-28" id="produkt">
      <div className="absolute inset-0">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="relative z-10 space-y-8" delay={100}>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-950/40 px-4 py-1.5 text-xs font-semibold text-brand-200 ring-1 ring-brand-800/50">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            KadryHR dla retail i zespołów zmianowych
          </div>
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight text-surface-50 md:text-5xl">
              Grafiki, czas pracy i urlopy domknięte w jednym, przewidywalnym rytmie.
            </h1>
            <p className="text-lg text-surface-300">
              KadryHR porządkuje grafikowanie w sklepach i sieciach usługowych: mniej telefonów, mniej kolizji,
              szybsze rozliczenia i stały wgląd w obsadę na każdej zmianie.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="#kontakt" className="btn-primary btn-hero">
              Umów demo
              <span aria-hidden>→</span>
            </Link>
            <Link href="#product-tour" className="btn-secondary btn-hero-outline">
              Zobacz jak działa
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-surface-300">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-brand-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal className="relative z-10" delay={220}>
          <div className="relative mx-auto max-w-md rounded-[28px] border border-white/10 bg-surface-900/70 p-5 shadow-soft backdrop-blur-xl">
            <div className="absolute -left-12 top-10 hidden h-32 w-32 rounded-full bg-brand-900/40 blur-3xl md:block" />
            <div className="absolute -right-12 bottom-10 hidden h-32 w-32 rounded-full bg-brand-900/40 blur-3xl md:block" />
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">Panel managera</p>
                  <p className="text-lg font-semibold text-surface-50">
                    Widzisz cały miesiąc w 2 minuty
                  </p>
                </div>
                <span className="rounded-full bg-brand-950/40 px-3 py-1 text-xs font-semibold text-brand-200">
                  Live
                </span>
              </div>
              <div className="rounded-2xl border border-surface-700/60 bg-surface-900/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span>Sklep Gdańsk Wrzeszcz</span>
                  <span>Październik 2026</span>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2 text-[10px]">
                  {[
                    "Pn",
                    "Wt",
                    "Śr",
                    "Cz",
                    "Pt",
                    "Sb",
                    "Nd",
                  ].map((day, index) => (
                    <div key={day} className="text-center text-surface-400">
                      {day}
                      <div className={`mt-2 h-10 rounded-lg ${index % 2 === 0 ? "bg-brand-900/40" : "bg-surface-800/70"}`}>
                        <div className="p-1 text-[10px] font-semibold text-surface-200">
                          {index % 2 === 0 ? "Pełna obsada" : "3 luki"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-surface-700/60 bg-surface-800/60 p-4">
                  <p className="text-xs font-semibold text-surface-300">
                    Dyspozycyjność
                  </p>
                  <p className="mt-2 text-sm font-semibold text-surface-50">
                    92% odpowiedzi w 24h
                  </p>
                </div>
                <div className="rounded-2xl border border-surface-700/60 bg-surface-800/60 p-4">
                  <p className="text-xs font-semibold text-surface-300">
                    Czas pracy
                  </p>
                  <p className="mt-2 text-sm font-semibold text-surface-50">
                    1 klik → raport miesiąca
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-brand-800/50 bg-brand-950/40 p-4 text-sm text-brand-100">
                „Zamknięcie miesiąca zajmuje nam teraz 2 godziny zamiast całego dnia.”
              </div>
            </div>
          </div>
          <svg
            className="pointer-events-none absolute -bottom-10 -right-20 hidden w-[320px] opacity-60 md:block"
            viewBox="0 0 400 400"
            aria-hidden="true"
          >
            <g className="topo-lines" fill="none" stroke="rgba(16, 124, 87, 0.35)" strokeWidth="1">
              <path d="M10 80 C120 40, 180 120, 300 80" />
              <path d="M20 130 C140 90, 200 170, 320 130" />
              <path d="M30 180 C160 140, 220 220, 340 180" />
              <path d="M40 230 C180 190, 240 270, 360 230" />
              <path d="M50 280 C200 240, 260 320, 380 280" />
            </g>
          </svg>
        </Reveal>
      </div>
    </section>
  );
}
