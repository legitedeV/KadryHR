import Link from "next/link";
import { FloatingStats } from "@/components/landing/FloatingStats";
import { HeroMockup } from "@/components/landing/HeroMockup";

const heroStats = [
  { label: "Automatyczne grafiki", value: "-8h / tydzień" },
  { label: "Powiadomienia", value: "Live + e-mail" },
  { label: "Zgodność czasu", value: "97%" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,216,255,0.7),transparent_55%),radial-gradient(circle_at_top_right,rgba(255,213,242,0.6),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(209,245,224,0.7),transparent_55%)]" />
      <div className="absolute left-1/2 top-[-120px] h-72 w-72 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              HR Suite • KadryHR
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                Grafiki, czas pracy i urlopy w jednym, nowoczesnym panelu.
              </h1>
              <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                Ułóż harmonogramy, pilnuj obsady i komunikuj się z zespołem bez chaosu. KadryHR daje
                pełny obraz zmian, godzin i dostępności w czasie rzeczywistym.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5"
              >
                Załóż konto
              </Link>
              <Link
                href="/panel/dashboard"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
              >
                Zobacz panel
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 text-center shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                >
                  <p className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <FloatingStats />
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
