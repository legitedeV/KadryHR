import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";

export function ContactSection() {
  return (
    <section className="px-6 py-20" id="kontakt">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Umów demo</p>
            <h2 className="text-3xl font-semibold text-surface-900 dark:text-surface-50">
              Pokażemy KadryHR na Twoich danych.
            </h2>
            <p className="text-surface-600 dark:text-surface-300">
              Opowiedz nam o liczbie lokalizacji, zmianach i wyzwaniach. Przygotujemy demo, które pokaże realne oszczędności.
            </p>
            <div className="space-y-4 rounded-3xl border border-surface-200/60 bg-white/70 p-6 shadow-sm dark:border-surface-800/60 dark:bg-surface-900/60">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">Kontakt bezpośredni</p>
                <p className="text-sm text-surface-600 dark:text-surface-300">kontakt@kadryhr.pl · +48 500 600 700</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">Czas reakcji</p>
                <p className="text-sm text-surface-600 dark:text-surface-300">Do 24h w dni robocze</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">Wdrożenia</p>
                <p className="text-sm text-surface-600 dark:text-surface-300">Onboarding i import danych w 7–14 dni</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-surface-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-surface-800/60 dark:bg-surface-900/60">
            <Suspense fallback={<div className="text-sm text-surface-500">Ładujemy formularz…</div>}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
