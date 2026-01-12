import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "RODO",
  description: "Informacje o przetwarzaniu danych osobowych w KadryHR.",
  alternates: { canonical: "/rodo" },
};

export default function RodoPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">RODO</p>
          <h1 className="text-4xl font-semibold text-surface-900 dark:text-surface-50">
            Polityka prywatności KadryHR
          </h1>
          <p className="text-surface-600 dark:text-surface-300">
            Dbamy o bezpieczeństwo danych osobowych. Poniżej znajdziesz kluczowe informacje o przetwarzaniu danych.
          </p>
        </header>
        <section className="space-y-3 text-sm text-surface-600 dark:text-surface-300">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Administrator danych</h2>
          <p>KadryHR Sp. z o.o., kontakt: kontakt@kadryhr.pl.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-600 dark:text-surface-300">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Zakres danych</h2>
          <p>Przetwarzamy dane niezbędne do realizacji usług HR, grafików i rozliczeń czasu pracy.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-600 dark:text-surface-300">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Prawa użytkownika</h2>
          <p>Masz prawo do dostępu, sprostowania, ograniczenia przetwarzania i usunięcia danych.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-600 dark:text-surface-300">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Kontakt i skargi</h2>
          <p>W sprawach prywatności napisz do nas: rodo@kadryhr.pl.</p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
