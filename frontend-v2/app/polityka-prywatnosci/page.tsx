import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Informacje o przetwarzaniu danych osobowych w KadryHR.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <Reveal className="space-y-4" delay={80}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Prywatność</p>
          <h1 className="text-4xl font-semibold text-surface-50">
            Polityka prywatności KadryHR
          </h1>
          <p className="text-surface-300">
            Dbamy o bezpieczeństwo danych osobowych. Poniżej znajdziesz kluczowe informacje o przetwarzaniu danych.
          </p>
        </Reveal>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Administrator danych</h2>
          <p>KadryHR Sp. z o.o., kontakt: kontakt@kadryhr.pl.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Zakres danych</h2>
          <p>Przetwarzamy dane niezbędne do realizacji usług HR, grafików i rozliczeń czasu pracy.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Prawa użytkownika</h2>
          <p>Masz prawo do dostępu, sprostowania, ograniczenia przetwarzania i usunięcia danych.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Kontakt i skargi</h2>
          <p>W sprawach prywatności napisz do nas: rodo@kadryhr.pl.</p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
