const bulletPoints = [
  "Harmonogram na tydzień gotowy w 10 minut",
  "Zautomatyzowane limity godzin i normy",
  "Szybkie decyzje o urlopach i zamianach",
  "Podgląd dostępności zespołu na żywo",
];

export function SecondaryHero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Workflow</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
            Menedżerowie widzą cały miesiąc w jednym widoku
          </h2>
          <p className="mt-4 text-sm text-slate-500 leading-relaxed">
            KadryHR łączy planowanie i realizację. Każda zmiana ma przypisaną rolę, miejsce i
            priorytet. Dzięki temu zespół pracuje spokojnie, a Ty masz kontrolę nad kosztami.
          </p>
          <ul className="mt-6 space-y-3">
            {bulletPoints.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#c7ddff] opacity-70 blur-2xl" />
          <div className="rounded-[24px] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Kalendarz</p>
                <p className="text-lg font-semibold text-slate-800">Grafik miesięczny</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                4 lokalizacje
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              {[
                { day: "Pn", shifts: 6 },
                { day: "Wt", shifts: 8 },
                { day: "Śr", shifts: 7 },
                { day: "Cz", shifts: 5 },
                { day: "Pt", shifts: 9 },
                { day: "Sb", shifts: 4 },
              ].map((tile) => (
                <div key={tile.day} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-slate-400">{tile.day}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">{tile.shifts}</p>
                  <p className="text-[10px] text-slate-400">zmian</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-700">
              Dostępność zespołu: 93% • Najwięcej braków w piątek
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
