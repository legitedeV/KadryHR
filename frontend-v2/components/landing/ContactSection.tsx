import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/motion/Reveal";

export function ContactSection() {
  return (
    <section className="landing-section border-t border-surface-900/70 px-6 py-28" id="kontakt">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <Reveal className="space-y-6" delay={80} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Umów demo</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              Pokażemy KadryHR na Twoich danych.
            </h2>
            <p className="text-surface-300">
              Opowiedz nam o liczbie lokalizacji, zmianach i wyzwaniach. Przygotujemy demo, które pokaże realne oszczędności.
            </p>
            <div className="space-y-4 rounded-[28px] border border-surface-800/60 bg-surface-900/60 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:-translate-y-0.5">
              <div>
                <p className="text-sm font-semibold text-surface-50">Kontakt bezpośredni</p>
                <p className="text-sm text-surface-300">kontakt@kadryhr.pl · +48 500 600 700</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-50">Czas reakcji</p>
                <p className="text-sm text-surface-300">Do 24h w dni robocze</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-50">Wdrożenia</p>
                <p className="text-sm text-surface-300">Onboarding i import danych w 7–14 dni</p>
              </div>
            </div>
          </Reveal>
          <Reveal className="rounded-[28px] border border-surface-800/60 bg-surface-900/60 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] backdrop-blur" delay={160} distance={20}>
            <Suspense fallback={<div className="text-sm text-surface-400">Ładujemy formularz…</div>}>
              <ContactForm />
            </Suspense>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
