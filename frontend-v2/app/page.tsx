import Link from "next/link";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { MarketingHeader } from "@/components/MarketingHeader";

const features = [
  {
    title: "Grafik w kilka klików",
    desc: "Układasz tydzień pracy jednym przeciągnięciem. Widok dzienny i tygodniowy.",
    icon: "📅",
  },
  {
    title: "Wnioski pracowników",
    desc: "Urlopy, nieobecności i zamiany zmian – wszystko w jednym widoku do akceptacji.",
    icon: "✅",
  },
  {
    title: "Powiadomienia",
    desc: "Automatyczne przypomnienia o zmianach i brakach obsady.",
    icon: "🔔",
  },
  {
    title: "Raporty i eksport",
    desc: "Szybkie zestawienia godzin i eksport do Excela / payrollu.",
    icon: "📊",
  },
];

const segments = [
  {
    title: "Sklepy convenience",
    text: "Żabka, Carrefour Express, osiedlowe markety – szybkie wdrożenie nawet w jeden dzień.",
  },
  { title: "Gastronomia", text: "Kawiarnie, bistra, food trucki – obsługa zmian rotacyjnych i sezonowych." },
  {
    title: "Franczyzy",
    text: "Jedno lub kilka miejsc – wspólna baza pracowników, lokalne grafiki.",
  },
];

const previewShifts = [
  { day: "Poniedziałek", slot: "6:00–14:30 · Kasia", status: "ok" },
  { day: "Poniedziałek", slot: "14:30–23:00 · Michał", status: "ok" },
  { day: "Wtorek", slot: "6:00–14:00 · NIEOBSADZONA", status: "warn" },
  { day: "Wtorek", slot: "14:00–22:00 · Ola", status: "ok" },
  { day: "Środa", slot: "6:00–14:00 · Kasia", status: "ok" },
  { day: "Środa", slot: "14:00–22:00 · Szymon", status: "ok" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-6 py-16 space-y-24">
        {/* Hero Section */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-700 dark:text-brand-300">
                  KadryHR.pl
                </h2>
                <p className="text-sm font-medium text-surface-600 dark:text-surface-300">
                  Kadry i płace bez tajemnic
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                Nowoczesny grafik dla małych biznesów
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-surface-900 dark:text-surface-50">
              KadryHR pomaga właścicielom sklepów <span className="gradient-text">układać grafik</span>, akceptować wnioski i
              pilnować obsady.
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
              Pastelowy, prosty interfejs po polsku. Zero zbędnych klików – szybkie podejrzenie zmian na dziś, obsługa urlopów i
              dodawanie pracowników w dwóch krokach.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/login" className="btn-primary text-base px-6 py-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Wypróbuj za darmo
              </Link>
              <Link href="/cennik" className="btn-secondary text-base px-6 py-3">
                Zobacz cennik
              </Link>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Pierwsze 14 dni gratis, bez karty.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Zmiany na dziś", value: "2 kliknięcia" },
                { label: "Wnioski urlopowe", value: "1 widok" },
                { label: "Dla zespołu", value: "mobile friendly" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-surface-200/80 bg-white/60 px-4 py-4 backdrop-blur-sm dark:border-surface-800/80 dark:bg-surface-900/60"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-bold text-surface-900 dark:text-surface-50">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-brand-200/60 blur-3xl dark:bg-brand-900/30" />
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-accent-200/40 blur-3xl dark:bg-accent-900/20" />
            <div className="card relative z-10 p-6 shadow-elevated">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-label">Podgląd grafiku</p>
                  <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">Tydzień 01–07.01</p>
                </div>
                <span className="badge badge-brand">Demo</span>
              </div>
              <div className="space-y-3">
                {previewShifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-surface-50/50 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-brand-200/50 dark:border-surface-700/80 dark:bg-surface-800/50 dark:hover:border-brand-700/50"
                  >
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">{shift.slot}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{shift.day}</p>
                    </div>
                    <span className={`badge ${shift.status === "ok" ? "badge-success" : "badge-warning"}`}>
                      {shift.status === "ok" ? "obsadzona" : "do obsady"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Lead Capture Section */}
        <section className="card p-8 shadow-elevated">
          <div className="max-w-xl">
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">
              Zostaw kontakt, odezwiemy się w 1 dzień roboczy
            </p>
            <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">Formularz z walidacją e-mail i potwierdzeniem wysyłki.</p>
            <div className="mt-6">
              <LeadCaptureForm />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">Funkcje</p>
              <h2 className="section-title mt-2">Zrobione pod właścicieli sklepów i menedżerów</h2>
            </div>
            <Link
              href="/panel/dashboard"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-2"
            >
              Zobacz widok panelu
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="card-hover p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-xl ring-1 ring-brand-100/80 dark:from-brand-950/50 dark:to-accent-950/50 dark:ring-brand-800/50">
                    {feature.icon}
                  </span>
                  <p className="font-bold text-surface-900 dark:text-surface-50">{feature.title}</p>
                </div>
                <p className="mt-4 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Segments Section */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <p className="section-label">Dla kogo</p>
            <h2 className="section-title">Najczęściej wybierają nas małe sieci i franczyzy</h2>
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              KadryHR jest po polsku, działa w przeglądarce i na telefonie. Zaproszenie pracownika to jedno kliknięcie – bez
              zakładania kont.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5">
            {segments.map((segment) => (
              <div key={segment.title} className="card-hover p-5">
                <p className="font-bold text-surface-900 dark:text-surface-50">{segment.title}</p>
                <p className="mt-3 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">{segment.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preview Table Section */}
        <section className="card relative overflow-hidden p-8">
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-900/30" />
          <div className="relative">
            <div className="mb-6">
              <p className="section-label">Podgląd</p>
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-2">Przykładowy fragment grafiku</h2>
              <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">
                Kolory sygnalizują obsadę. Klikasz wniosek, akceptujesz, a grafik aktualizuje się automatycznie.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                  <tr className="border-b border-surface-200 dark:border-surface-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Dzień
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Zmiany
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                  {["Pon", "Wt", "Śr", "Czw", "Pt"].map((day) => (
                    <tr key={day} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-surface-700 dark:text-surface-200">{day}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {previewShifts
                            .filter((s) => s.day.startsWith(day))
                            .map((s, i) => (
                              <span key={`${day}-${i}`} className={`badge ${s.status === "ok" ? "badge-success" : "badge-warning"}`}>
                                {s.slot}
                              </span>
                            ))}
                          {previewShifts.filter((s) => s.day.startsWith(day)).length === 0 && (
                            <span className="text-surface-400 dark:text-surface-500">Brak zmian</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="card p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-brand-50/50 to-accent-50/30 dark:from-brand-950/30 dark:to-accent-950/20">
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">Gotowy na prostszy grafik?</p>
            <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
              Stwórz konto demo, dodaj pracownika i zaplanuj pierwszą zmianę w 2 minuty.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="btn-primary">
              Rozpocznij
            </Link>
            <Link href="/kontakt" className="btn-secondary">
              Porozmawiajmy
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
