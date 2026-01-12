import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { PricingSection } from "@/components/landing/PricingSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Pricing",
  description: "KadryHR — pricing per użytkownik dla zespołów zmianowych w retail i usługach.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main>
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
