"use client";

import { Reveal } from "@/components/motion/Reveal";

const outcomes = [
  {
    title: "Marża pod kontrolą",
    description:
      "Centralny widok kosztów godzinowych i planów obsady pozwala domykać budżety tygodniowe bez nadgodzin.",
    metric: "−18% kosztów nadgodzin",
    accent: "bg-emerald-500/10 text-emerald-200 border-emerald-400/30",
  },
  {
    title: "Prognozy oparte o dane",
    description:
      "Trend seasonality + historia sprzedaży tworzą rekomendacje grafiku. Manager dostaje gotowe scenariusze.",
    metric: "+12% dopasowania do popytu",
    accent: "bg-cyan-500/10 text-cyan-200 border-cyan-400/30",
  },
  {
    title: "Zgodność i spokój",
    description:
      "Automatyczne reguły odpoczynków, limitów i urlopów redukują ryzyko kar i audytów.",
    metric: "0 naruszeń norm czasu pracy",
    accent: "bg-violet-500/10 text-violet-200 border-violet-400/30",
  },
];

const trends = [
  {
    label: "AI dla planowania zmian",
    detail: "Rekomendacje obsady w 2 minuty.",
  },
  {
    label: "Self‑service pracownika",
    detail: "Dyspozycyjność i urlopy bez telefonów.",
  },
  {
    label: "Real‑time payroll",
    detail: "RCP + raporty gotowe do płac.",
  },
  {
    label: "Zarządzanie energią i ESG",
    detail: "Lepsze decyzje o otwarciach i obsadzie.",
  },
];

export function BusinessOutcomeSection() {
  return (
    <section className="landing-section border-t border-surface-900/80 px-6 py-24" id="business-outcomes">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="space-y-5" delay={90} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
              Trendy + opłacalność
            </p>
            <h2 className="text-3xl font-semibold text-surface-50 md:text-4xl">
              Strategiczne planowanie pracy, które dowozi wynik finansowy.
            </h2>
            <p className="text-surface-300">
              KadryHR łączy planowanie, czas pracy i analitykę, aby firmy retail i usługowe podejmowały
              decyzje o obsadzie szybciej, pewniej i bardziej rentownie.
            </p>
            <div className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-surface-400">
                <span className="rounded-full bg-brand-950/40 px-3 py-1 text-brand-200">
                  ROI dashboard
                </span>
                <span>Ostatnie 30 dni</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-surface-800/70 bg-surface-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Oszczędności</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-50">86 200 zł</p>
                  <p className="text-xs text-emerald-300">+9% vs poprzedni miesiąc</p>
                </div>
                <div className="rounded-2xl border border-surface-800/70 bg-surface-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Wskaźnik obsady</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-50">96%</p>
                  <p className="text-xs text-surface-400">Docelowy poziom 95%</p>
                </div>
                <div className="rounded-2xl border border-surface-800/70 bg-surface-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Nadwyżki</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-50">-14%</p>
                  <p className="text-xs text-surface-400">Mniej godzin nadplanowych</p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal className="grid gap-4" delay={140} distance={18}>
              {outcomes.map((outcome) => (
                <div
                  key={outcome.title}
                  className="rounded-3xl border border-surface-800/70 bg-surface-950/50 p-6 transition-all hover:-translate-y-1 hover:border-brand-700/40"
                >
                  <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${outcome.accent}`}>
                    {outcome.metric}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-surface-50">{outcome.title}</h3>
                  <p className="mt-2 text-sm text-surface-300">{outcome.description}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={200} distance={18}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Trendy 2024/25</p>
              <div className="mt-4 space-y-3">
                {trends.map((trend) => (
                  <div key={trend.label} className="flex items-start gap-3 rounded-2xl border border-surface-800/70 bg-surface-900/60 p-4">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-surface-100">{trend.label}</p>
                      <p className="text-xs text-surface-400">{trend.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
