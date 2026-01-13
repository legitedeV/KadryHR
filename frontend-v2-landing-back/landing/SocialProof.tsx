import { Reveal } from "@/components/motion/Reveal";

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
          <Reveal className="space-y-3" delay={80}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Social proof</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              Co mówią zespoły z pilotażu.
            </h2>
          </Reveal>
          <Reveal className="rounded-full border border-surface-800/60 bg-surface-900/60 px-4 py-2 text-xs font-semibold text-surface-300" delay={120}>
            Wyniki po 3 miesiącach wdrożenia
          </Reveal>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((item, index) => (
            <Reveal
              key={item.quote}
              delay={140 + index * 80}
              className="rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm backdrop-blur"
            >
              <p className="text-sm text-surface-300">“{item.quote}”</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">
                {item.role}
              </p>
            </Reveal>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="grid gap-4 rounded-3xl border border-brand-800/50 bg-brand-950/40 p-6" delay={160}>
            <h3 className="text-xl font-semibold text-surface-50">Wyniki, które robią różnicę</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric, index) => (
                <Reveal key={metric.label} delay={200 + index * 60} className="rounded-2xl bg-surface-900/70 p-4 text-center shadow-sm">
                  <p className="text-2xl font-semibold text-brand-200">{metric.value}</p>
                  <p className="mt-1 text-xs text-surface-300">{metric.label}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>
          <Reveal className="rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm backdrop-blur" delay={220}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Security badge</p>
            <h3 className="mt-3 text-xl font-semibold text-surface-50">Bezpieczeństwo i zgodność</h3>
            <p className="mt-3 text-sm text-surface-300">
              KadryHR działa w środowisku UE, wspiera role i uprawnienia oraz prowadzi logi zmian. Jesteśmy gotowi na audyty i polityki wewnętrzne.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "RODO-ready",
                "EU hosting-ready",
                "Szyfrowanie danych",
                "Logi aktywności",
              ].map((badge) => (
                <span key={badge} className="rounded-full border border-brand-800/60 bg-brand-950/40 px-3 py-1 text-xs font-semibold text-brand-200">
                  {badge}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
