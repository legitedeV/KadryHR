import Link from "next/link";

export function HeroPanel() {
  return (
    <section className="relative overflow-hidden bg-[#F7F9FB]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-10 top-10 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative">
          <div className="absolute -left-6 top-10 hidden h-64 w-12 rounded-full bg-gradient-to-b from-emerald-400/40 via-emerald-500/10 to-transparent lg:block" />
          <div className="rounded-[2.5rem] border border-surface-300 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-8 shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between text-xs text-surface-600">
              <span>Panel kontrolny kadr</span>
              <span className="rounded-full border border-surface-300 px-3 py-1">Tydzień 32</span>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-surface-300 bg-white p-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-surface-500">
                  <span>Grafik tygodniowy</span>
                  <span className="text-emerald-200/80">84% obsadzenia</span>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2 text-[11px] text-surface-600">
                  {[
                    "Pn",
                    "Wt",
                    "Śr",
                    "Cz",
                    "Pt",
                    "Sb",
                    "Nd",
                  ].map((day, index) => (
                    <div key={day} className="space-y-2">
                      <div className="text-surface-500">{day}</div>
                      <div
                        className={`h-10 rounded-lg border border-surface-300 bg-gradient-to-b ${
                          index === 2 || index === 5
                            ? "from-emerald-400/40 to-emerald-500/10"
                            : "from-white/10 to-white/5"
                        }`}
                      />
                      <div
                        className={`h-6 rounded-lg border border-surface-300 ${
                          index === 4
                            ? "bg-emerald-300/20"
                            : "bg-surface-100"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-surface-600">
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200">
                    12 zmian obsadzonych automatycznie
                  </span>
                  <span className="rounded-full border border-surface-300 px-3 py-1">
                    3 braki do uzupełnienia
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-surface-300 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-surface-500">
                    Spóźnienia
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-surface-300 bg-surface-100 px-3 py-2">
                      <span>Sklep Centrum</span>
                      <span className="text-emerald-200">2 alerty</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-surface-300 bg-surface-100 px-3 py-2">
                      <span>Restauracja Rondo</span>
                      <span className="text-surface-500">Brak</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-surface-300 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-surface-500">
                    Skróty akcji
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <button className="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-left text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/20">
                      Zaplanuj tydzień
                    </button>
                    <button className="w-full rounded-xl border border-surface-300 bg-surface-100 px-4 py-2 text-left text-surface-600 transition hover:border-surface-400 hover:bg-surface-100">
                      Zatwierdź RCP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Premium HR dla retail i gastro
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-surface-900 sm:text-5xl">
            Grafiki, RCP i urlopy w jednym miejscu. Bez Excela, bez chaosu.
          </h1>
          <p className="text-lg text-surface-600">
            KadryHR to jeden pulpit do zarządzania zespołem w wielu lokalizacjach. Widzisz
            obsadę, dyspozycyjność i koszty pracy bez przekopywania się przez pliki.
          </p>
          <ul className="space-y-3 text-sm text-surface-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
              Stała kontrola kosztów pracy na poziomie zmiany i lokalizacji.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
              Jedno źródło prawdy o czasie pracy, spóźnieniach i nadgodzinach.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
              Mniej telefonów od pracowników, więcej czasu na prowadzenie firmy.
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <a
              href="#lead-form"
              className="rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-surface-900 transition hover:bg-emerald-200"
            >
              Umów prezentację
            </a>
            <Link
              href="/register"
              className="rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition hover:border-surface-500 hover:text-surface-900"
            >
              Przetestuj KadryHR
            </Link>
          </div>
          <div className="grid gap-4 pt-4 text-xs text-surface-500 sm:grid-cols-3">
            <div className="rounded-2xl border border-surface-300 bg-surface-100 p-4">
              <div className="text-lg font-semibold text-surface-900">+32%</div>
              <div>mniej telefonów o zmiany</div>
            </div>
            <div className="rounded-2xl border border-surface-300 bg-surface-100 p-4">
              <div className="text-lg font-semibold text-surface-900">5 min</div>
              <div>na ułożenie tygodnia</div>
            </div>
            <div className="rounded-2xl border border-surface-300 bg-surface-100 p-4">
              <div className="text-lg font-semibold text-surface-900">99%</div>
              <div>zgodności RCP z grafikiem</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
