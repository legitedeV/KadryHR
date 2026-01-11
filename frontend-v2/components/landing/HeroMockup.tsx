export function HeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-[#b7c7ff] opacity-60 blur-3xl" />
      <div className="absolute -right-6 top-12 h-28 w-28 rounded-full bg-[#ffd5f2] opacity-60 blur-3xl" />
      <div className="absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-[#d4f4e2] opacity-70 blur-3xl" />

      <div className="relative rounded-[24px] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/90" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">KadryHR</p>
              <p className="text-sm font-semibold text-slate-800">Panel dyżurów</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <div className="ml-3 flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs text-slate-600">
              <span className="h-6 w-6 rounded-full bg-white shadow" />
              Kasia M.
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[140px_1fr] gap-4">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Zespoły</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/5 px-3 py-2">
                <span>Sklep A</span>
                <span className="text-xs font-semibold text-emerald-500">8/8</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/5 px-3 py-2">
                <span>Sklep B</span>
                <span className="text-xs font-semibold text-amber-500">6/7</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/5 px-3 py-2">
                <span>Magazyn</span>
                <span className="text-xs font-semibold text-emerald-500">4/4</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Dziś</p>
                <p className="text-lg font-semibold text-slate-800">Wtorek • 12 zmian</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Braki: 1 osoba
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Poranek", time: "06:00 - 14:00", status: "Obsada 4/4", color: "text-emerald-600" },
                { label: "Popołudnie", time: "12:00 - 20:00", status: "Obsada 3/4", color: "text-rose-500" },
                { label: "Wieczór", time: "18:00 - 23:00", status: "Obsada 5/5", color: "text-emerald-600" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-700">{row.label}</p>
                    <p className="text-xs text-slate-400">{row.time}</p>
                  </div>
                  <span className={`text-xs font-semibold ${row.color}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
