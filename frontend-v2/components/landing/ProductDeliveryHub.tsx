"use client";

import { Reveal } from "@/components/motion/Reveal";

const operatingCore = [
  "Planowanie zmian z kontrolą obsady",
  "Dyspozycyjność z automatycznym oknem decyzji",
  "Urlopy i zastępstwa w jednym obiegu",
  "RCP i rozliczenia bez ręcznych korekt",
];

const commandLayer = [
  "Role i uprawnienia zgodne z realną strukturą retail",
  "Jedno źródło danych dla managerów i zespołów",
  "Powiadomienia z pełnym śladem decyzji",
];

const assuranceLayer = [
  "Audit log i historia zmian, zawsze pod ręką",
  "Raporty gotowe do payroll i audytów",
  "Standardy bezpieczeństwa dla organizacji wielooddziałowych",
];

export function ProductDeliveryHub() {
  return (
    <section className="landing-section border-t border-surface-900/70 px-6 py-28" id="product-delivery-hub">
      <div className="mx-auto max-w-6xl space-y-12">
        <Reveal className="space-y-5 text-center" delay={80} distance={18}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
            KadryHR · Operating System
          </p>
          <h2 className="text-3xl font-semibold text-surface-50 md:text-4xl">
            System operacyjny pracy zmianowej, zaprojektowany dla skali.
          </h2>
          <p className="text-surface-300">
            KadryHR buduje jednolity rytm między planowaniem, decyzjami i rozliczeniami. Bez hałasu.
          </p>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal
            className="rounded-[28px] border border-surface-800/60 bg-surface-950/60 p-6 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.7)]"
            delay={120}
            distance={18}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">Operating Core</p>
            <h3 className="mt-3 text-xl font-semibold text-surface-50">Praca zmianowa bez tarcia</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {operatingCore.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            className="rounded-[28px] border border-brand-800/40 bg-brand-950/40 p-6 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.7)]"
            delay={160}
            distance={18}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Command Layer</p>
            <h3 className="mt-3 text-xl font-semibold text-surface-50">Decyzje pod kontrolą</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {commandLayer.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            className="rounded-[28px] border border-surface-800/60 bg-surface-950/60 p-6 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.7)]"
            delay={200}
            distance={18}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">Assurance</p>
            <h3 className="mt-3 text-xl font-semibold text-surface-50">Zaufanie operacyjne</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {assuranceLayer.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
