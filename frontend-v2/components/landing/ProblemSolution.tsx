import { Reveal } from "@/components/motion/Reveal";

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
    <section className="landing-section border-t border-surface-900/80 px-6 py-24" id="funkcje">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal className="space-y-4" delay={80} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Problem</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              Chaos zmianowy kosztuje czas i pieniądze.
            </h2>
            <p className="text-surface-300">
              KadryHR projektujemy z zespołami retail, które żyją na zmianach. Każdy element produktu
              usuwa pojedyncze źródło chaosu, zanim zamieni się w koszt.
            </p>
          </Reveal>
          <Reveal className="space-y-4" delay={160} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Rozwiązanie</p>
            <h3 className="text-2xl font-semibold text-surface-50">
              Jedna platforma do grafiku, urlopów i czasu pracy.
            </h3>
            <p className="text-surface-300">
              Dzięki spójnym przepływom masz te same dane w planowaniu, rozliczeniach i komunikacji z zespołem.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal
            className="space-y-4 rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm backdrop-blur"
            delay={120}
            distance={20}
          >
            <p className="text-sm font-semibold text-surface-400">Co boli dziś</p>
            <div className="grid gap-4">
              {problems.map((item, index) => (
                <Reveal
                  key={item.title}
                  delay={180 + index * 60}
                  className="rounded-2xl border border-surface-700/60 bg-surface-800/70 p-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="font-semibold text-surface-50">{item.title}</p>
                  <p className="mt-2 text-sm text-surface-300">{item.desc}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>
          <Reveal className="space-y-4 rounded-3xl border border-brand-800/50 bg-brand-950/40 p-6 shadow-sm" delay={180} distance={20}>
            <p className="text-sm font-semibold text-brand-200">Co daje KadryHR</p>
            <div className="grid gap-4">
              {solutions.map((item, index) => (
                <Reveal
                  key={item.title}
                  delay={200 + index * 60}
                  className="rounded-2xl border border-brand-800/50 bg-surface-900/60 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="font-semibold text-surface-50">{item.title}</p>
                  <p className="mt-2 text-sm text-surface-300">{item.desc}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
