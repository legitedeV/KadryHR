import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { ContactForm } from "@/components/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Skontaktuj się z zespołem KadryHR i umów demo dla swojej sieci zmianowej.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Kontakt
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-50">
            Porozmawiajmy o Twoim grafiku zmianowym.
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
            Wypełnij formularz – przygotujemy demo dopasowane do liczby lokalizacji i zespołu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="card p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  Dane kontaktowe
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Skontaktuj się bezpośrednio
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">E-mail</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">kontakt@kadryhr.pl</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Telefon</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">+48 500 600 700</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Godziny pracy</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">Pon–Pt, 9:00–17:00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                Formularz demo
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Podaj podstawowe informacje, a my wrócimy z propozycją terminu.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
