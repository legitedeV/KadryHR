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
    <section className="relative bg-[#0b1110] py-24">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0f1916] to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              Z Excela vs z KadryHR
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Zamień bałagan w grafiku na jeden, przejrzysty widok.
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70">
            3 najczęstsze scenariusze operacyjne
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-6">
          <div className="hidden items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40 md:flex">
            <span>Przed</span>
            <span>Po wdrożeniu KadryHR</span>
          </div>
          <div className="mt-6 space-y-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.title}
                className="grid gap-4 rounded-3xl border border-white/10 bg-[#111b18]/70 p-6 md:grid-cols-[1fr_auto_1fr] md:items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60">{scenario.before}</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border border-emerald-300/40 bg-emerald-300/10 text-center text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                    vs
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                    KadryHR
                  </h4>
                  <p className="mt-2 text-sm text-white/70">{scenario.after}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                      Mniej chaosu
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
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
