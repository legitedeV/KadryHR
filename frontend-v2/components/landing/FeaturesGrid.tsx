const features = [
  {
    title: "Grafiki bez luk",
    desc: "Widzisz braki obsady zanim pojawią się w sklepie. Automatyczne alerty i podpowiedzi.",
    icon: "🗓️",
  },
  {
    title: "Czas pracy pod kontrolą",
    desc: "Precyzyjne godziny, zgodność z ewidencją i szybkie eksporty do rozliczeń.",
    icon: "⏱️",
  },
  {
    title: "Urlopy i zamiany",
    desc: "Pracownicy wnioskują z telefonu, a Ty zatwierdzasz jednym kliknięciem.",
    icon: "🌴",
  },
  {
    title: "Powiadomienia live",
    desc: "Push, SMS i e-mail w jednym miejscu. Zawsze wiesz, kto potwierdził zmianę.",
    icon: "📣",
  },
];

export function FeaturesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Funkcje</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
            Wszystko, czego potrzebujesz do zarządzania zespołem
          </h2>
        </div>
        <p className="max-w-md text-sm text-slate-500">
          KadryHR upraszcza pracę menedżerów, pracowników i właścicieli, łącząc grafiki, czas pracy
          i komunikację w jednym miejscu.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
              <span className="text-xl">{feature.icon}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-800">{feature.title}</h3>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
