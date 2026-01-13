import { MarketingHeader } from "@/components/MarketingHeader";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { ProductTour } from "@/components/landing/ProductTour";
import { StorySection } from "@/components/landing/StorySection";
import { FeatureGroups } from "@/components/landing/FeatureGroups";
import { UseCases } from "@/components/landing/UseCases";
import { SocialProof } from "@/components/landing/SocialProof";
import { PricingSection } from "@/components/landing/PricingSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SectionScroller } from "@/components/landing/SectionScroller";
import Script from "next/script";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <SectionScroller>
        <Hero />
        <ProblemSolution />
        <ProductTour />
        <StorySection />
        <FeatureGroups />
        <UseCases />
        <SocialProof />
        <PricingSection />
        <SecuritySection />
        <ContactSection />
      </SectionScroller>
      <LandingFooter />
      <Script id="schema-ld" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "KadryHR",
              url: "https://kadryhr.pl",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales",
                email: "kontakt@kadryhr.pl",
                telephone: "+48 500 600 700",
              },
            },
            {
              "@type": "SoftwareApplication",
              name: "KadryHR",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "KadryHR to platforma HR, grafiku zmianowego i rozliczeń czasu pracy dla retail i zespołów zmianowych.",
              offers: {
                "@type": "Offer",
                price: "12",
                priceCurrency: "PLN",
              },
            },
          ],
        })}
      </Script>
    </div>
  );
}
