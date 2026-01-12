import Link from "next/link";
import Script from "next/script";
import { MarketingHeader } from "@/components/MarketingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { pricingFaq, pricingPlans } from "@/components/landing/pricing-data";
import { Reveal } from "@/components/motion/Reveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cennik",
  description:
    "Porównaj plany KadryHR dla retail i zespołów zmianowych. Jasne ceny per użytkownik oraz pełne wsparcie wdrożenia.",
  alternates: { canonical: "/cennik" },
};

const comparisonRows = [
  {
    label: "Grafiki miesięczne i tygodniowe",
    values: [true, true, true, true],
  },
  {
    label: "Dyspozycyjność i urlopy",
    values: [true, true, true, true],
  },
  {
    label: "RCP (QR/kiosk)",
    values: [true, true, true, true],
  },
  {
    label: "Szablony grafiku i normy",
    values: [false, true, true, true],
  },
  {
    label: "Raporty kosztowe i KPI",
    values: [false, true, true, true],
  },
  {
    label: "Integracje kadrowo-płacowe",
    values: [false, false, true, true],
  },
  {
    label: "SSO i SLA",
    values: [false, false, false, true],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        <Reveal className="space-y-4 text-center max-w-3xl mx-auto" delay={80}>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-950/50 px-4 py-1.5 text-xs font-semibold text-brand-300 ring-1 ring-brand-800/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cennik KadryHR
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-surface-50">
            Jasne plany, elastyczna skala.
          </h1>
          <p className="text-lg text-surface-300 leading-relaxed">
            Płacisz za aktywnych użytkowników. Otrzymujesz pełen moduł grafiku, czasu pracy i urlopów bez ukrytych kosztów.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {pricingPlans.map((plan, index) => (
            <Reveal
              key={plan.name}
              delay={140 + index * 80}
              className={`relative flex flex-col gap-6 p-8 rounded-3xl transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-brand-950/50 to-surface-900 ring-2 ring-brand-700 shadow-soft"
                  : "card-hover"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-gradient-to-r from-brand-500 to-accent-500 text-white ring-2 ring-surface-900 px-4 py-1.5">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-surface-50">{plan.name}</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-surface-50">{plan.price}</span>
                  <span className="text-surface-400 text-sm">{plan.cadence}</span>
                </div>
                <p className="text-sm text-surface-300">{plan.desc}</p>
              </div>
              <ul className="flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-surface-200">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/kontakt" className={plan.highlighted ? "btn-primary w-full justify-center py-3" : "btn-secondary w-full justify-center py-3"}>
                Umów demo
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm" delay={120}>
          <h2 className="text-xl font-semibold text-surface-50">Porównanie planów</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-surface-400">
                <tr>
                  <th className="py-3 pr-4">Funkcja</th>
                  {pricingPlans.map((plan) => (
                    <th key={plan.name} className="py-3 pr-4">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-t border-surface-800/60">
                    <td className="py-3 pr-4 text-surface-200">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="py-3 pr-4">
                        {value ? (
                          <span className="text-emerald-400">✔</span>
                        ) : (
                          <span className="text-surface-500">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {pricingFaq.map((item, index) => (
            <Reveal key={item.question} delay={160 + index * 60} className="rounded-2xl border border-surface-800/60 bg-surface-800/60 p-4">
              <p className="text-sm font-semibold text-surface-50">{item.question}</p>
              <p className="mt-2 text-sm text-surface-300">{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </main>
      <LandingFooter />
      <Script id="faq-jsonld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pricingFaq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        })}
      </Script>
    </div>
  );
}
