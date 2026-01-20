import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

const defaultQuotes = [
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

const defaultMetrics = [
  { value: 42, prefix: "-", suffix: "%", label: "mniej konfliktów w grafiku" },
  { value: 31, prefix: "-", suffix: "%", label: "krótsze zamknięcie miesiąca" },
  { value: 55, prefix: "-", suffix: "%", label: "mniej telefonów od zespołu" },
];

export type SocialProofContent = {
  heading?: string;
  subheading?: string;
  quotes?: Array<{ quote: string; role?: string }>;
  metrics?: Array<{ value: number; prefix?: string; suffix?: string; label: string }>;
};

export function SocialProof({ content }: { content?: SocialProofContent }) {
  const quotes = content?.quotes?.length ? content.quotes : defaultQuotes;
  const metrics = content?.metrics?.length ? content.metrics : defaultMetrics;

  return (
    <section className="landing-section border-t border-surface-900/80 px-6 py-24" id="opinie">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Reveal className="space-y-3" delay={80} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Social proof</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              {content?.heading ?? "Co mówią zespoły z pilotażu."}
            </h2>
          </Reveal>
          <Reveal className="rounded-full border border-surface-800/60 bg-surface-900/60 px-4 py-2 text-xs font-semibold text-surface-300" delay={120} distance={16}>
            {content?.subheading ?? "Wyniki po 3 miesiącach wdrożenia"}
          </Reveal>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((item, index) => (
            <Reveal
              key={`${item.quote}-${index}`}
              delay={140 + index * 80}
              className="rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-1"
              distance={18}
            >
              <p className="text-sm text-surface-300">“{item.quote}”</p>
              {item.role && (
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">
                  {item.role}
                </p>
              )}
            </Reveal>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="grid gap-4 rounded-3xl border border-brand-800/50 bg-brand-950/40 p-6" delay={160} distance={20}>
            <h3 className="text-xl font-semibold text-surface-50">Wyniki, które robią różnicę</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric, index) => (
                <Reveal
                  key={metric.label}
                  delay={200 + index * 60}
                  className="rounded-2xl bg-surface-900/70 p-4 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1"
                  distance={16}
                >
                  <p className="text-2xl font-semibold text-brand-200">
                    <CountUp value={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
                  </p>
                  <p className="mt-1 text-xs text-surface-300">{metric.label}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>
          <Reveal className="rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm backdrop-blur" delay={220} distance={20}>
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
