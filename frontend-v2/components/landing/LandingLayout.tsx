import Link from "next/link";
import { HeroPanel } from "@/components/landing/HeroPanel";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { TimelineSection } from "@/components/landing/TimelineSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { ModuleMapSection } from "@/components/landing/ModuleMapSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PersonasSection } from "@/components/landing/PersonasSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LeadFormSection } from "@/components/landing/LeadFormSection";

export function LandingLayout() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] text-surface-900">
      <header className="sticky top-0 z-40 border-b border-surface-300 bg-[#F7F9FB]/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            KadryHR
          </Link>
          <div className="hidden items-center gap-6 text-sm text-surface-600 md:flex">
            <a href="#jak-dziala" className="transition hover:text-surface-900">
              Jak działa
            </a>
            <a href="#moduly" className="transition hover:text-surface-900">
              Moduły
            </a>
            <a href="#dla-kogo" className="transition hover:text-surface-900">
              Dla kogo
            </a>
            <a href="#cennik" className="transition hover:text-surface-900">
              Oferta
            </a>
            <a href="#faq" className="transition hover:text-surface-900">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 transition hover:border-surface-500 hover:text-surface-900 md:inline-flex"
            >
              Zaloguj się
            </Link>
            <a
              href="#lead-form"
              className="rounded-full bg-emerald-300/90 px-4 py-2 text-sm font-semibold text-surface-900 transition hover:bg-emerald-200"
            >
              Umów prezentację
            </a>
          </div>
        </nav>
      </header>

      <main>
        <HeroPanel />
        <TrustedBySection />
        <TimelineSection />
        <ComparisonSection />
        <ModuleMapSection />
        <SocialProofSection />
        <PersonasSection />
        <PricingSection />
        <FaqSection />
        <LeadFormSection />
      </main>

      <footer className="border-t border-surface-300 bg-[#F7F9FB]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-surface-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-surface-900">KadryHR</span>
            <span>Premium platforma grafiku i RCP</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:sales@kadryhr.pl" className="transition hover:text-surface-900">
              sales@kadryhr.pl
            </a>
            <span>+48 22 307 11 20</span>
            <Link href="/register" className="transition hover:text-surface-900">
              Załóż konto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
