const personas = [
  {
    role: "Manager sieci sklepów spożywczych",
    pains: [
      "Różne grafiki w każdej lokalizacji",
      "Brak szybkiej informacji o brakach",
      "Trudne rozliczenia kosztów pracy",
    ],
    outcomes: [
      "Jeden widok na wszystkie placówki",
      "Natychmiastowe alerty o brakach",
      "Raport kosztów pracy na zmianę",
    ],
  },
  {
    role: "Właściciel restauracji",
    pains: [
      "Częste zamiany zmian na ostatnią chwilę",
      "Niespójne RCP",
      "Za dużo ręcznych ustaleń",
    ],
    outcomes: [
      "Dyspozycyjność i zamiany w aplikacji",
      "RCP zgodne z grafikiem",
      "Historia akceptacji zmian",
    ],
  },
  {
    role: "Kierownik firmy usługowej",
    pains: [
      "Pracownicy w terenie bez jasnych zasad",
      "Brak kontroli nad nadgodzinami",
      "Długi czas przygotowania raportów",
    ],
    outcomes: [
      "Czytelne grafiki i potwierdzenia",
      "Alerty nadgodzin i spóźnień",
      "Eksport danych do payrollu",
    ],
  },
  {
    role: "HR w sieci gastronomicznej",
    pains: [
      "Brak jednego źródła danych",
      "Urlopy poza systemem",
      "Niespójna komunikacja z managerami",
    ],
    outcomes: [
      "Spójne dane w całej organizacji",
      "Wnioski urlopowe online",
      "Automatyczny obieg akceptacji",
    ],
  },
];

export function PersonasSection() {
  return (
    <section id="dla-kogo" className="relative py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F9FB] via-[#F7F9FB] to-[#F7F9FB]" />
      <div className="relative mx-auto max-w-5xl px-5">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
              Dla kogo jest KadryHR
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-surface-900 sm:text-3xl">
              Różne role, ten sam porządek w grafiku i RCP.
            </h2>
            <p className="mt-4 text-surface-600">
              KadryHR buduje wspólny język między operacją, HR i managerami.
              Zobacz, jak wygląda to w praktyce.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {personas.map((persona) => (
              <div
                key={persona.role}
                className="rounded-2xl border border-surface-300 bg-surface-100 p-5 text-sm text-surface-600"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-700">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-emerald-600"
                    >
                      <path
                        d="M12 3L20 7V17L12 21L4 17V7L12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 7V12L16 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-surface-900">
                    {persona.role}
                  </h3>
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-surface-500">
                    Bóle
                  </p>
                  <ul className="mt-3 space-y-2">
                    {persona.pains.map((pain) => (
                      <li key={pain} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
                    Po wdrożeniu
                  </p>
                  <ul className="mt-3 space-y-2">
                    {persona.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
