import { MarketingHeader } from "@/components/MarketingHeader";
import { CTASection } from "@/components/landing/CTASection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { Hero } from "@/components/landing/Hero";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LogosStrip } from "@/components/landing/LogosStrip";
import { SecondaryHero } from "@/components/landing/SecondaryHero";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <MarketingHeader />
      <main>
        <Hero />
        <LogosStrip />
        <FeaturesGrid />
        <SecondaryHero />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
