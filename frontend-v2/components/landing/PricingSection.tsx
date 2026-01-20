import Link from "next/link";
import { pricingFaq, pricingPlans } from "./pricing-data";
import { Reveal } from "@/components/motion/Reveal";

export function PricingSection() {
  return (
    <section className="landing-section border-t border-surface-900/70 px-6 py-28" id="cennik">
      <div className="mx-auto max-w-6xl space-y-12">
        <Reveal className="space-y-4 text-center" delay={80} distance={18}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Cennik</p>
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
              className={`relative flex h-full flex-col justify-between rounded-[28px] border p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:-translate-y-0.5 ${
                plan.highlighted
                  ? "border-brand-800/50 bg-brand-950/40 shadow-soft"
                  : "border-surface-800/60 bg-surface-900/60"
              }`}
              distance={20}
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
                  {plan.cadence && (
                    <span className={`text-sm text-surface-400 ${plan.price === "Wycena" ? "block mt-1" : "ml-2"}`}>
                      {plan.cadence}
                    </span>
                  )}
                </div>
                <p className="text-sm text-surface-300">{plan.desc}</p>
                <ul className="space-y-3 text-sm text-surface-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-brand-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="#kontakt"
                className={`${plan.highlighted ? "btn-primary" : "btn-secondary"} mt-6 group`}
              >
                Umów demo
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal className="grid gap-6 rounded-[28px] border border-surface-800/60 bg-surface-900/60 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)]" delay={160} distance={20}>
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
                className="rounded-2xl border border-surface-800/60 bg-surface-800/60 p-4 transition-transform duration-500 hover:-translate-y-0.5"
                distance={16}
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
