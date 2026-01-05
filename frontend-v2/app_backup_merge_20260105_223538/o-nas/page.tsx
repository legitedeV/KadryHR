import Link from "next/link";
import { MarketingHeader } from "@/components/MarketingHeader";

const milestones = [
  { year: "2024", text: "Startujemy jako prosty grafik dla Żabek i małych sklepów." },
  { year: "2025", text: "Dodajemy wnioski urlopowe, integracje payroll i wersję mobilną." },
  { year: "Dalej", text: "Rozszerzamy raporty, powiadomienia SMS i moduł odbić (T&A)." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/60 via-white to-slate-100/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <MarketingHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 space-y-10">
        <div className="space-y-3">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            O nas
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
            KadryHR powstało, by odchudzić biurokrację w małych biznesach.
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Sami prowadziliśmy niewielkie sklepy i wiemy, że czasu zawsze
            brakuje. Dlatego uprościliśmy grafik, wnioski i komunikację do kilku
            kliknięć. Wszystko po polsku, bez skomplikowanego wdrożenia.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {milestones.map((item) => (
            <div
              key={item.year}
              className="card p-4 space-y-2 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">
                {item.year}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="card p-6 space-y-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Nasze zasady projektowania
          </p>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <li>• Każdy proces maksymalnie w 2–3 kliknięcia.</li>
            <li>• Czytelne kolory i pastelowe akcenty zamiast krzykliwych alarmów.</li>
            <li>• Priorytet mobile – menedżerowie mogą działać z telefonu.</li>
            <li>• Wszystkie komunikaty po polsku, gotowe pod przyszłe i18n.</li>
          </ul>
          <div className="pt-2">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-600"
            >
              Porozmawiajmy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
