const modules = [
  {
    name: "Grafik",
    description: "Układanie zmian na wielu lokalizacjach.",
    metric: "5 min",
    detail: "na ułożenie tygodnia",
    position: "lg:absolute lg:left-0 lg:top-12",
  },
  {
    name: "RCP",
    description: "Rejestracja czasu pracy z alertami.",
    metric: ">99%",
    detail: "zgodności z grafikiem",
    position: "lg:absolute lg:right-0 lg:top-8",
  },
  {
    name: "Urlopy",
    description: "Wnioski i akceptacje bez maili.",
    metric: "2 klik",
    detail: "do zatwierdzenia",
    position: "lg:absolute lg:left-12 lg:bottom-6",
  },
  {
    name: "Profile",
    description: "Dane pracowników i historia zmian.",
    metric: "1 karta",
    detail: "na pracownika",
    position: "lg:absolute lg:right-12 lg:bottom-8",
  },
  {
    name: "Raporty",
    description: "Eksport do księgowości i payrollu.",
    metric: "0 błędów",
    detail: "w raportach",
    position: "lg:absolute lg:left-1/2 lg:bottom-[-2rem] lg:-translate-x-1/2",
  },
];

export function ModuleMapSection() {
  return (
    <section id="moduly" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F9FB] via-[#F7F9FB] to-[#F7F9FB]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              Moduły platformy
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-surface-900 sm:text-4xl">
              Jeden rdzeń, wokół niego cały system operacyjny dla kadr.
            </h2>
            <p className="mt-4 text-surface-600">
              KadryHR łączy grafik, RCP i urlopy w jeden spójny ekosystem. Moduły
              wymieniają dane między sobą, więc decyzje kadrowe są zawsze oparte na
              aktualnych informacjach.
            </p>
            <div className="mt-6 rounded-3xl border border-surface-300 bg-surface-100 p-6 text-sm text-surface-600">
              <p className="text-surface-700">Wspólne KPI</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-surface-300 bg-white p-4">
                  <p className="text-lg font-semibold text-surface-900">-12%</p>
                  <p>kosztów nadgodzin</p>
                </div>
                <div className="rounded-2xl border border-surface-300 bg-white p-4">
                  <p className="text-lg font-semibold text-surface-900">+18%</p>
                  <p>wykorzystania godzin</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative lg:min-h-[36rem]">
            <div className="relative mx-auto flex max-w-lg flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-emerald-300/30 bg-gradient-to-br from-emerald-400/10 via-white/[0.04] to-transparent p-10 text-center">
              <span className="text-xs uppercase tracking-[0.4em] text-emerald-200/80">
                KadryHR — rdzeń
              </span>
              <h3 className="text-2xl font-semibold text-surface-900">Panel operacyjny</h3>
              <p className="text-sm text-surface-600">
                Wszystkie decyzje kadrowe powiązane w jednej osi czasu i jednym
                zestawie danych.
              </p>
              <div className="grid w-full gap-3 text-left text-xs text-surface-600">
                <div className="flex items-center justify-between rounded-2xl border border-surface-300 bg-white px-4 py-3">
                  <span>Jedno źródło danych</span>
                  <span className="text-emerald-200">Live</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-surface-300 bg-white px-4 py-3">
                  <span>Integracje HR/Payroll</span>
                  <span className="text-surface-600">API</span>
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-4 lg:mt-0">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className={`group rounded-3xl border border-surface-300 bg-white/80 p-5 text-sm text-surface-600 transition hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-surface-50 ${module.position}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-surface-900">
                      {module.name}
                    </h4>
                    <span className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                      Moduł
                    </span>
                  </div>
                  <p className="mt-2">{module.description}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                      {module.metric}
                    </span>
                    <span className="text-surface-600">{module.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
