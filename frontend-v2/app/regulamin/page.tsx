import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin świadczenia usług KadryHR.",
  alternates: { canonical: "/regulamin" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <Reveal className="space-y-4" delay={80}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Regulamin</p>
          <h1 className="text-4xl font-semibold text-surface-50">
            Regulamin świadczenia usług KadryHR
          </h1>
          <p className="text-surface-300">
            Regulamin określa zasady korzystania z platformy KadryHR oraz zakres odpowiedzialności stron.
          </p>
        </Reveal>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Zakres usług</h2>
          <p>KadryHR dostarcza narzędzia do planowania grafiku, rejestracji czasu pracy i zarządzania urlopami.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Odpowiedzialność</h2>
          <p>Zapewniamy dostępność systemu zgodnie z planem SLA oraz wsparcie w dni robocze.</p>
        </section>
        <section className="space-y-3 text-sm text-surface-300">
          <h2 className="text-lg font-semibold text-surface-50">Rezygnacja</h2>
          <p>Klient może wypowiedzieć umowę z zachowaniem okresu rozliczeniowego. Dane są eksportowane na żądanie.</p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
