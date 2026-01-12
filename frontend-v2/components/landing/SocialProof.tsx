const quotes = [
  {
    quote:
      "W pilotażu z 6 lokalizacjami skróciliśmy układanie grafiku z 2 dni do 5 godzin w miesiącu.",
    role: "Kierowniczka operacyjna, retail",
  },
  {
    quote:
      "Największa różnica? Pracownicy wreszcie widzą zmiany wcześniej i rzadziej proszą o korekty.",
    role: "Manager zmiany, gastronomia",
  },
  {
    quote:
      "Raporty czasu pracy są gotowe od ręki. Kadry nie muszą już zbierać plików od kierowników.",
    role: "Specjalistka HR, sieć usług",
  },
];

const metrics = [
  { value: "-42%", label: "mniej konfliktów w grafiku" },
  { value: "-31%", label: "krótsze zamknięcie miesiąca" },
  { value: "-55%", label: "mniej telefonów od zespołu" },
];

export function SocialProof() {
  return (
    <section className="px-6 py-20" id="opinie">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Social proof</p>
            <h2 className="text-3xl font-semibold text-surface-900 dark:text-surface-50">
              Co mówią zespoły z pilotażu.
            </h2>
          </div>
          <div className="rounded-full border border-surface-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-surface-500 dark:border-surface-800/60 dark:bg-surface-900/60">
            Wyniki po 3 miesiącach wdrożenia
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((item) => (
            <div
              key={item.quote}
              className="rounded-3xl border border-surface-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-surface-800/60 dark:bg-surface-900/60"
            >
              <p className="text-sm text-surface-600 dark:text-surface-300">“{item.quote}”</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">
                {item.role}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 rounded-3xl border border-brand-200/60 bg-brand-50/60 p-6 dark:border-brand-800/50 dark:bg-brand-950/40">
            <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">Wyniki, które robią różnicę</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-surface-900/70">
                  <p className="text-2xl font-semibold text-brand-600 dark:text-brand-200">{metric.value}</p>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-300">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-surface-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-surface-800/60 dark:bg-surface-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Security badge</p>
            <h3 className="mt-3 text-xl font-semibold text-surface-900 dark:text-surface-50">Bezpieczeństwo i zgodność</h3>
            <p className="mt-3 text-sm text-surface-600 dark:text-surface-300">
              KadryHR działa w środowisku UE, wspiera role i uprawnienia oraz prowadzi logi zmian. Jesteśmy gotowi na audyty i polityki wewnętrzne.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "RODO-ready",
                "EU hosting-ready",
                "Szyfrowanie danych",
                "Logi aktywności",
              ].map((badge) => (
                <span key={badge} className="rounded-full border border-brand-200/70 bg-brand-50/80 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
