import Link from "next/link";
import { MarketingHeader } from "@/components/MarketingHeader";

const plans = [
  {
    name: "Starter",
    price: "49 zł / msc",
    desc: "Dla pojedynczego sklepu lub kiosku",
    features: [
      "Grafik tygodniowy i dzienny",
      "Podgląd nieobecności",
      "Powiadomienia e-mail",
      "Wsparcie na czacie",
    ],
  },
  {
    name: "Pro",
    price: "99 zł / msc",
    badge: "Najpopularniejszy",
    desc: "Dla kilku lokalizacji i małych franczyz",
    features: [
      "Wnioski urlopowe i zamiany zmian",
      "Eksport godzin do Excela",
      "Proste raporty godzinowe",
      "Priorytetowe wsparcie",
    ],
  },
  {
    name: "Enterprise",
    price: "Indywidualnie",
    desc: "Dla sieci >10 lokalizacji",
    features: [
      "SSO i separacja danych",
      "Zaawansowane uprawnienia",
      "Dostosowanie pod proces",
      "Onboarding z dedykowanym opiekunem",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/60 via-white to-slate-100/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 space-y-10">
        <div className="space-y-3">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Cennik
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
            Proste plany. Bez umów terminowych.
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Startujesz za darmo przez 14 dni, potem możesz wybrać plan starter
            lub pro. W każdej chwili zmienisz lub anulujesz pakiet.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="card p-6 flex flex-col gap-4 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.badge && (
                    <span className="badge bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-900/40 dark:text-brand-100 dark:border-brand-800">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">{plan.price}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {plan.desc}
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <span className="text-emerald-500">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-600"
                >
                  Wypróbuj
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Masz więcej niż 10 lokalizacji?
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Przygotujemy ofertę pod Twój proces – z onboardingiem dla zespołu.
            </p>
          </div>
          <Link
            href="/kontakt"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-100"
          >
            Umów demo
          </Link>
        </div>
      </main>
    </div>
  );
}
