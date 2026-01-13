import Link from "next/link";

export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-[28px] bg-gradient-to-r from-[#dbe6ff] via-white to-[#ffdff4] px-8 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Start</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
              Przenieś zarządzanie zespołem na wyższy poziom
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Darmowe wdrożenie, pełne wsparcie i panel gotowy do działania w 24h.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5"
            >
              Wypróbuj za darmo
            </Link>
            <Link
              href="/kontakt"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
            >
              Umów demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
