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
    highlighted: true,
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
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cennik
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Proste plany. Bez umów terminowych.
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
            Startujesz za darmo przez 14 dni, potem możesz wybrać plan starter
            lub pro. W każdej chwili zmienisz lub anulujesz pakiet.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col gap-6 p-8 rounded-3xl transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-brand-50 to-white ring-2 ring-brand-200 shadow-glow dark:from-brand-950/50 dark:to-surface-900 dark:ring-brand-700"
                  : "card-hover"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-gradient-to-r from-brand-500 to-accent-500 text-white ring-2 ring-white dark:ring-surface-900 px-4 py-1.5">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-surface-900 dark:text-surface-50">{plan.price.split(" ")[0]}</span>
                  {plan.price.includes("zł") && (
                    <span className="text-surface-500 dark:text-surface-400">{plan.price.split(" ").slice(1).join(" ")}</span>
                  )}
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300">
                  {plan.desc}
                </p>
              </div>
              <ul className="flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-200">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={plan.highlighted ? "btn-primary w-full justify-center py-3" : "btn-secondary w-full justify-center py-3"}
              >
                Wypróbuj
              </Link>
            </div>
          ))}
        </div>

        <div className="card p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-surface-50 to-brand-50/30 dark:from-surface-900 dark:to-brand-950/30">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-50">
                Masz więcej niż 10 lokalizacji?
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                Przygotujemy ofertę pod Twój proces – z onboardingiem dla zespołu.
              </p>
            </div>
          </div>
          <Link
            href="/kontakt"
            className="btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Umów demo
          </Link>
        </div>
      </main>
    </div>
  );
}
