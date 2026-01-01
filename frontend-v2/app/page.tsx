import Link from "next/link";
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
  {
    title: "Gastronomia",
    text: "Kawiarnie, bistra, food trucki – obsługa zmian rotacyjnych i sezonowych.",
  },
  {
    title: "Franczyzy",
    text: "Jedno lub kilka miejsc – wspólna baza pracowników, lokalne grafiki.",
  },
];

const previewShifts = [
  { day: "Poniedziałek", slot: "6:00–14:00 · Kasia", status: "ok" },
  { day: "Poniedziałek", slot: "14:00–22:00 · Michał", status: "ok" },
  { day: "Wtorek", slot: "6:00–14:00 · NIEOBSADZONA", status: "warn" },
  { day: "Wtorek", slot: "14:00–22:00 · Ola", status: "ok" },
  { day: "Środa", slot: "6:00–14:00 · Kasia", status: "ok" },
  { day: "Środa", slot: "14:00–22:00 · Szymon", status: "ok" },
];

const testimonials = [
  {
    name: "Magda, właścicielka 3 sklepów",
    quote:
      "Zespoły wreszcie widzą grafik w telefonie, a ja mam spokój z dzwonieniem po zmianach.",
  },
  {
    name: "Michał, manager sieci gastro",
    quote: "Podgląd urlopów i zastępstw w jednym miejscu sprawił, że przestały nam się dublować dyżury.",
  },
];

const steps = [
  {
    title: "Ułóż grafik",
    text: "Przeciągasz godziny, dodajesz osoby i sprawdzasz obsadę na każdy lokal.",
  },
  {
    title: "Zgarnij wnioski",
    text: "Urlop, zamiana, oddanie zmiany – jedno kliknięcie akceptuje lub odrzuca zgłoszenie.",
  },
  {
    title: "Wyślij powiadomienia",
    text: "Ekipa widzi zmiany w aplikacji, dostaje przypomnienia i może potwierdzić obecność.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 space-y-16">
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold text-brand-700 shadow-soft ring-1 ring-brand-100/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-brand-200 dark:ring-brand-800/70">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-100">
                ✨
              </span>
              KadryHR · grafik, wnioski i powiadomienia w jednym miejscu
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-slate-900 dark:text-slate-50">
              Nowoczesny grafik, który wygląda i działa jak 2024.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Pastelowy, prosty interfejs po polsku. Zero zbędnych klików – szybkie
              podejrzenie zmian na dziś, obsługa urlopów i dodawanie pracowników w dwóch krokach.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-600"
              >
                Wypróbuj za darmo
              </Link>
              <Link
                href="/cennik"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
              >
                Zobacz cennik
              </Link>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                14 dni testu, bez karty. Mobilny podgląd w cenie.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
              {[
                { label: "Zmiany na dziś", value: "2 kliknięcia" },
                { label: "Wnioski urlopowe", value: "1 widok" },
                { label: "Powiadomienia", value: "push & e-mail" },
                { label: "Zespół", value: "mobile friendly" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-100/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:ring-slate-800"
                >
                  <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand-100 blur-3xl dark:bg-brand-900/40" />
            <div className="card relative z-10 space-y-4 p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Podgląd grafiku</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Tydzień 01–07.01</p>
                </div>
                <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800">
                  Demo
                </span>
              </div>
              <div className="grid gap-2 text-xs">
                {previewShifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80"
                  >
                    <div>
                      <p className="text-slate-900 dark:text-slate-50">{shift.slot}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{shift.day}</p>
                    </div>
                    <span
                      className={`badge ${
                        shift.status === "ok"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800"
                      }`}
                    >
                      {shift.status === "ok" ? "obsadzona" : "do obsady"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-slate-500 dark:text-slate-400">Braki w tygodniu</p>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">1 zmiana</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-slate-500 dark:text-slate-400">Wnioski oczekujące</p>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">3 do decyzji</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Funkcje</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Zrobione pod właścicieli sklepów i menedżerów
              </h2>
            </div>
            <Link
              href="/panel/dashboard"
              className="text-sm font-medium text-brand-700 underline underline-offset-4 dark:text-brand-200"
            >
              Zobacz widok panelu
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card p-4 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg shadow-sm ring-1 ring-brand-100 dark:bg-brand-900/40 dark:ring-brand-800">
                    {feature.icon}
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{feature.title}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-3">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Dla kogo</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Najczęściej wybierają nas małe sieci i franczyzy
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              KadryHR jest po polsku, działa w przeglądarce i na telefonie. Zaproszenie pracownika to jedno kliknięcie – bez
              zakładania kont.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <div key={segment.title} className="card p-4 transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{segment.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{segment.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card relative overflow-hidden p-8">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand-200 blur-3xl dark:bg-brand-900/50" />
          <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-brand-100 blur-3xl dark:bg-brand-900/40" />
          <div className="relative flex flex-col gap-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Podgląd</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Przykładowy fragment grafiku</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Kolory sygnalizują obsadę. Klikasz wniosek, akceptujesz, a grafik aktualizuje się automatycznie.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {steps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{step.title}</p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50/90 dark:bg-slate-900/70">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Dzień</th>
                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Zmiany</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {["Pon", "Wt", "Śr", "Czw", "Pt"].map((day, idx) => (
                    <tr key={day}>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{day}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {previewShifts
                            .filter((s) => s.day.startsWith(day))
                            .map((s, i) => (
                              <span
                                key={`${idx}-${i}`}
                                className={`badge ${
                                  s.status === "ok"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
                                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800"
                                }`}
                              >
                                {s.slot}
                              </span>
                            ))}
                          {previewShifts.filter((s) => s.day.startsWith(day)).length === 0 && (
                            <span className="text-slate-400 dark:text-slate-500">Brak zmian</span>
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-6 space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Opinie klientów</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <p className="text-sm text-slate-700 dark:text-slate-200">“{item.quote}”</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Gotowy na prostszy grafik?</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Stwórz konto demo, dodaj pracownika i zaplanuj pierwszą zmianę w 2 minuty.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-600"
              >
                Rozpocznij
              </Link>
              <Link
                href="/kontakt"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-100"
              >
                Porozmawiajmy
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
