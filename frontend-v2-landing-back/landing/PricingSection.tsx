import Link from "next/link";
import { pricingFaq, pricingPlans } from "./pricing-data";
import { Reveal } from "@/components/motion/Reveal";

export function PricingSection() {
  return (
    <section className="px-6 py-20" id="cennik">
      <div className="mx-auto max-w-6xl space-y-12">
        <Reveal className="space-y-4 text-center" delay={80}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Cennik</p>
          <h2 className="text-3xl font-semibold text-surface-50">
            Skala, która rośnie razem z Twoją siecią.
          </h2>
          <p className="mx-auto max-w-2xl text-surface-300">
            Płacisz za aktywnych użytkowników. Bez ukrytych kosztów, z jasnym onboardingiem i wsparciem.
          </p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {pricingPlans.map((plan, index) => (
            <Reveal
              key={plan.name}
              delay={140 + index * 80}
              className={`relative flex h-full flex-col justify-between rounded-3xl border p-6 shadow-sm ${
                plan.highlighted
                  ? "border-brand-800/60 bg-brand-950/40 shadow-soft"
                  : "border-surface-800/60 bg-surface-900/60"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-surface-50">{plan.name}</h3>
                <div>
                  <span className="text-4xl font-semibold text-surface-50">
                    {plan.price}
                  </span>
                  <span className="ml-2 text-sm text-surface-400">{plan.cadence}</span>
                </div>
                <p className="text-sm text-surface-300">{plan.desc}</p>
                <ul className="space-y-3 text-sm text-surface-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-brand-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="#kontakt"
                className={plan.highlighted ? "btn-primary mt-6" : "btn-secondary mt-6"}
              >
                Umów demo
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal className="grid gap-6 rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm" delay={160}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-surface-50">FAQ o cenach</h3>
            <Link href="/cennik" className="text-sm font-semibold text-brand-300 hover:text-brand-200">
              Pełny cennik
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pricingFaq.map((item, index) => (
              <Reveal
                key={item.question}
                delay={200 + index * 60}
                className="rounded-2xl border border-surface-800/60 bg-surface-800/60 p-4"
              >
                <p className="text-sm font-semibold text-surface-50">{item.question}</p>
                <p className="mt-2 text-sm text-surface-300">{item.answer}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
