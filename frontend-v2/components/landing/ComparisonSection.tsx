const scenarios = [
  {
    title: "Układanie grafiku dla 3 lokalizacji",
    before: "Pięć arkuszy Excela, dwa telefony na zmianę i brak pewności, kto przyjdzie.",
    after:
      "Jedna tablica grafiku, widok lokalizacji obok siebie i automatyczne braki do uzupełnienia.",
  },
  {
    title: "Zastępstwa i zmiany na ostatnią chwilę",
    before: "Wiadomości na Messengerze i brak śladu, kto zaakceptował zmianę.",
    after:
      "Dyspozycyjność w aplikacji, propozycje zmian i pełna historia akceptacji.",
  },
  {
    title: "Kontrola spóźnień i nadgodzin",
    before: "Ręczne przepisywanie z listy obecności i brak wczesnych alertów.",
    after:
      "RCP z automatycznymi alertami i raportem różnic względem grafiku.",
  },
];

export function ComparisonSection() {
  return (
    <section className="relative bg-[#F7F9FB] py-16">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FFFFFF] to-transparent" />
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
              Z Excela vs z KadryHR
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-surface-900 sm:text-3xl">
              Zamień bałagan w grafiku na jeden, przejrzysty widok.
            </h2>
          </div>
          <div className="rounded-full border border-surface-300 bg-surface-100 px-5 py-2 text-sm text-surface-600">
            3 najczęstsze scenariusze operacyjne
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-surface-300 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-5">
          <div className="hidden items-center justify-between text-xs uppercase tracking-[0.3em] text-surface-500 md:flex">
            <span>Przed</span>
            <span>Po wdrożeniu KadryHR</span>
          </div>
          <div className="mt-5 space-y-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.title}
                className="grid gap-4 rounded-2xl border border-surface-300 bg-white/70 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-sm text-surface-600">{scenario.before}</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border border-emerald-400 bg-emerald-50 text-center text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 flex items-center justify-center">
                    vs
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    KadryHR
                  </h4>
                  <p className="mt-2 text-sm text-surface-600">{scenario.after}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-emerald-700">
                      Mniej chaosu
                    </span>
                    <span className="rounded-full border border-surface-300 bg-surface-100 px-3 py-1 text-surface-600">
                      Historia decyzji
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
