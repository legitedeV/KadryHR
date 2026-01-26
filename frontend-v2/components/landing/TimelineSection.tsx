const timeline = [
  {
    day: "Poniedziałek",
    title: "Układasz grafik bez dziesięciu telefonów.",
    description:
      "KadryHR podpowiada obsadę na podstawie sprzedaży, dostępności i limitów kosztów.",
    details: ["7 lokalizacji", "Auto-obsada", "Limit kosztów"],
  },
  {
    day: "Środa",
    title: "Zamiany zmian i dyspozycyjność w jednym miejscu.",
    description:
      "Pracownicy widzą propozycje i potwierdzają zmiany, a Ty masz pełną zgodność.",
    details: ["3 wnioski", "2 zamiany", "1 blokada"],
  },
  {
    day: "Sobota",
    title: "RCP i nadgodziny pod kontrolą.",
    description:
      "System zlicza czas pracy i od razu pokazuje odchylenia od grafiku.",
    details: ["Spóźnienia", "Nadgodziny", "Alert kosztów"],
  },
  {
    day: "Koniec miesiąca",
    title: "Eksport do rozliczeń bez ręcznego scalania.",
    description:
      "Jedno kliknięcie i masz plik gotowy do księgowości i do payrollu.",
    details: ["Eksport XLSX", "Integracje", "Historia zmian"],
  },
];

export function TimelineSection() {
  return (
    <section id="jak-dziala" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1110] via-[#0f1916] to-[#0b1110]" />
      <div className="absolute -left-40 top-24 h-72 w-72 rotate-12 rounded-[3rem] border border-emerald-400/20 bg-emerald-400/5" />
      <div className="absolute bottom-12 right-20 h-56 w-56 -rotate-6 rounded-[3rem] border border-white/10 bg-white/5" />
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              Jak wygląda tydzień pracy
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Tydzień z KadryHR układa się jak dobrze zaplanowany grafik.
            </h2>
            <p className="mt-4 text-white/70">
              Storytelling zamiast listy funkcji. Zobacz, kiedy system robi za Ciebie
              najwięcej i gdzie realnie odzyskujesz czas.
            </p>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/60">Średni tydzień klienta KadryHR</p>
              <div className="mt-4 grid gap-4 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Ułożenie grafiku</span>
                  <span className="text-emerald-200">-70% czasu</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Akceptacja zmian</span>
                  <span className="text-emerald-200">-58% maili</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>RCP i raporty</span>
                  <span className="text-emerald-200">+1 dzień oszczędzony</span>
                </div>
              </div>
            </div>
          </div>
          <ol className="space-y-6">
            {timeline.map((item, index) => (
              <li
                key={item.day}
                className="group relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent p-6 transition hover:-translate-y-1 hover:border-emerald-300/40"
              >
                <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/40 text-sm font-semibold text-emerald-200/90">
                  {index + 1}
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  {item.day}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-white/70">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {item.details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-[#111b18] p-3 text-xs text-white/60">
                    <p className="text-white/80">Dostępność zespołu</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 flex-1 rounded-full bg-emerald-300/30" />
                      <span>92%</span>
                    </div>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-[#111b18] p-3 text-xs text-white/60">
                    <p className="text-white/80">Alerty zmian</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 flex-1 rounded-full bg-amber-300/30" />
                      <span>4</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
