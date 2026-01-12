const problems = [
  {
    title: "Grafiki na ostatnią chwilę",
    desc: "Niezebrana dyspozycyjność i ręczne układanie zmian kończą się lukami i telefonami dzień przed otwarciem.",
  },
  {
    title: "Urlopy bez kontroli",
    desc: "Wnioski krążą w wiadomościach, a manager dowiaduje się o kolizji, gdy jest już za późno.",
  },
  {
    title: "Niepewne rozliczenia",
    desc: "RCP jest w kilku plikach, a miesięczne podsumowanie powstaje ręcznie w Excelu.",
  },
  {
    title: "Brak jednej komunikacji",
    desc: "Zmiany i zastępstwa są ustalane w kilku kanałach naraz, bez historii i potwierdzeń.",
  },
];

const solutions = [
  {
    title: "Dyspozycyjność zamyka się sama",
    desc: "Pracownicy podają okna pracy z wyprzedzeniem, a Ty widzisz braki zanim zaczniesz układać grafik.",
  },
  {
    title: "Grafik, który nie pęka",
    desc: "Budujesz zmiany na jednym widoku i od razu widzisz konflikty, normy i minimalne obsady.",
  },
  {
    title: "Urlopy z zastępstwami",
    desc: "Wnioski i zamiany zmian są zatwierdzane w aplikacji, z automatyczną kontrolą braków.",
  },
  {
    title: "RCP i raporty jednym kliknięciem",
    desc: "Rejestracja czasu pracy (QR lub kiosk) oraz raporty godzinowe bez ręcznego scalania.",
  },
];

export function ProblemSolution() {
  return (
    <section className="px-6 py-16" id="funkcje">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Problem</p>
            <h2 className="text-3xl font-semibold text-surface-900 dark:text-surface-50">
              Chaos zmianowy kosztuje czas i pieniądze.
            </h2>
            <p className="text-surface-600 dark:text-surface-300">
              KadryHR projektujemy z zespołami retail, które żyją na zmianach. Każdy element produktu
              usuwa pojedyncze źródło chaosu, zanim zamieni się w koszt.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Rozwiązanie</p>
            <h3 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
              Jedna platforma do grafiku, urlopów i czasu pracy.
            </h3>
            <p className="text-surface-600 dark:text-surface-300">
              Dzięki spójnym przepływom masz te same dane w planowaniu, rozliczeniach i komunikacji z zespołem.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-surface-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-surface-800/60 dark:bg-surface-900/60">
            <p className="text-sm font-semibold text-surface-500">Co boli dziś</p>
            <div className="grid gap-4">
              {problems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-surface-200/60 bg-surface-50/80 p-4 dark:border-surface-700/60 dark:bg-surface-800/70">
                  <p className="font-semibold text-surface-900 dark:text-surface-50">{item.title}</p>
                  <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-brand-200/50 bg-brand-50/60 p-6 shadow-sm dark:border-brand-800/50 dark:bg-brand-950/40">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">Co daje KadryHR</p>
            <div className="grid gap-4">
              {solutions.map((item) => (
                <div key={item.title} className="rounded-2xl border border-brand-200/60 bg-white/80 p-4 shadow-sm dark:border-brand-800/50 dark:bg-surface-900/60">
                  <p className="font-semibold text-surface-900 dark:text-surface-50">{item.title}</p>
                  <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
