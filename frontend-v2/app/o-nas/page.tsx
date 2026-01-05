import Link from "next/link";
import { MarketingHeader } from "@/components/MarketingHeader";

const milestones = [
  { year: "2024", text: "Startujemy jako prosty grafik dla Żabek i małych sklepów.", icon: "🚀" },
  { year: "2025", text: "Dodajemy wnioski urlopowe, integracje payroll i wersję mobilną.", icon: "📱" },
  { year: "Dalej", text: "Rozszerzamy raporty, powiadomienia SMS i moduł odbić (T&A).", icon: "🔮" },
];

const principles = [
  { icon: "🖱️", text: "Każdy proces maksymalnie w 2–3 kliknięcia." },
  { icon: "🎨", text: "Czytelne kolory i pastelowe akcenty zamiast krzykliwych alarmów." },
  { icon: "📱", text: "Priorytet mobile – menedżerowie mogą działać z telefonu." },
  { icon: "🇵🇱", text: "Wszystkie komunikaty po polsku, gotowe pod przyszłe i18n." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-16">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            O nas
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            KadryHR powstało, by odchudzić biurokrację w małych biznesach.
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
            Sami prowadziliśmy niewielkie sklepy i wiemy, że czasu zawsze
            brakuje. Dlatego uprościliśmy grafik, wnioski i komunikację do kilku
            kliknięć. Wszystko po polsku, bez skomplikowanego wdrożenia.
          </p>
        </div>

        <div className="space-y-6">
          <p className="section-label">Nasza historia</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {milestones.map((item, index) => (
              <div
                key={item.year}
                className="card-hover p-6 relative"
              >
                <div className="absolute top-6 right-6 text-3xl opacity-20">
                  {item.icon}
                </div>
                <div className="relative">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 text-lg font-bold text-brand-700 dark:from-brand-900/50 dark:to-accent-900/50 dark:text-brand-300 mb-4">
                    {index + 1}
                  </div>
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {item.year}
                  </p>
                  <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 space-y-6 bg-gradient-to-br from-surface-50 to-brand-50/30 dark:from-surface-900 dark:to-brand-950/30">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-50">
                Nasze zasady projektowania
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Co nas wyróżnia
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((principle) => (
              <div
                key={principle.text}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/60 dark:bg-surface-800/40"
              >
                <span className="text-xl">{principle.icon}</span>
                <span className="text-sm text-surface-700 dark:text-surface-200 leading-relaxed">
                  {principle.text}
                </span>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <Link
              href="/kontakt"
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Porozmawiajmy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
