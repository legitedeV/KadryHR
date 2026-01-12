import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Informacje o plikach cookies w KadryHR.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Cookies</p>
          <h1 className="text-4xl font-semibold text-surface-50">
            Polityka cookies KadryHR
          </h1>
          <p className="text-surface-300">
            Pliki cookies pomagają nam utrzymać bezpieczeństwo, analizować ruch i komunikować się z użytkownikami.
          </p>
        </header>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Niezbędne</h2>
          <p>Służą do działania serwisu, zapamiętania preferencji i bezpieczeństwa sesji.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Analityczne</h2>
          <p>Pomagają nam rozumieć sposób korzystania z aplikacji i poprawiać UX.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Marketingowe</h2>
          <p>Umożliwiają personalizowanie komunikacji i ofert dla zainteresowanych klientów.</p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
