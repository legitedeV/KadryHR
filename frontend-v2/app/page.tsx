import { MarketingHeader } from "@/components/MarketingHeader";
import { Hero, HeroContent } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { ProductTour } from "@/components/landing/ProductTour";
import { StorySection } from "@/components/landing/StorySection";
import { FeatureGroups } from "@/components/landing/FeatureGroups";
import { UseCases } from "@/components/landing/UseCases";
import { SocialProof, SocialProofContent } from "@/components/landing/SocialProof";
import { PricingSection } from "@/components/landing/PricingSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SectionScroller } from "@/components/landing/SectionScroller";
import Script from "next/script";
import { fetchWebsitePage, fetchWebsiteSettings } from "@/lib/website-content";
import { resolveFooterContent } from "@/lib/website-mappers";

export async function generateMetadata() {
  const page = await fetchWebsitePage("home");
  if (!page) return {};

  return {
    title: page.seoTitle ?? "KadryHR",
    description: page.seoDescription ?? undefined,
    openGraph: page.seoImageUrl ? { images: [page.seoImageUrl] } : undefined,
    alternates: { canonical: "/" },
  };
}

function resolveHeroContent(pageContent: Awaited<ReturnType<typeof fetchWebsitePage>>): HeroContent | undefined {
  const heroSection = pageContent?.sections.find((section) => section.key === "hero");
  if (!heroSection) return undefined;

  const highlights = heroSection.blocks
    .filter((block) => block.type === "highlight")
    .map((block) => block.title || block.body)
    .filter((item): item is string => Boolean(item));

  const stats = heroSection.blocks
    .filter((block) => block.type === "stat")
    .map((block) => ({
      value: typeof block.extra?.value === "string" ? block.extra.value : block.title ?? "",
      label: block.title ?? block.body ?? "",
    }))
    .filter((stat) => stat.value && stat.label);

  const badge = heroSection.blocks.find((block) => block.type === "badge");
  const primaryCta = heroSection.blocks.find((block) => block.type === "primary_cta");
  const secondaryCta = heroSection.blocks.find((block) => block.type === "secondary_cta");

  return {
    badgeLabel: badge?.title ?? badge?.body ?? undefined,
    title: heroSection.title ?? undefined,
    subtitle: heroSection.subtitle ?? undefined,
    primaryCtaLabel: primaryCta?.title ?? undefined,
    primaryCtaUrl:
      typeof primaryCta?.extra?.url === "string" ? (primaryCta.extra.url as string) : undefined,
    secondaryCtaLabel: secondaryCta?.title ?? undefined,
    secondaryCtaUrl:
      typeof secondaryCta?.extra?.url === "string" ? (secondaryCta.extra.url as string) : undefined,
    highlights: highlights.length ? highlights : undefined,
    stats: stats.length ? stats : undefined,
  };
}

function resolveSocialProofContent(
  pageContent: Awaited<ReturnType<typeof fetchWebsitePage>>,
): SocialProofContent | undefined {
  const section = pageContent?.sections.find((item) => item.key === "testimonials");
  if (!section) return undefined;

  const quotes = section.blocks
    .filter((block) => block.type === "testimonial")
    .map((block) => ({
      quote: block.body ?? block.title ?? "",
      role: typeof block.extra?.role === "string" ? (block.extra.role as string) : block.title ?? undefined,
    }))
    .filter((quote) => quote.quote);

  const metrics = section.blocks
    .filter((block) => block.type === "metric")
    .map((block) => ({
      value: typeof block.extra?.value === "number" ? (block.extra.value as number) : 0,
      prefix: typeof block.extra?.prefix === "string" ? (block.extra.prefix as string) : undefined,
      suffix: typeof block.extra?.suffix === "string" ? (block.extra.suffix as string) : undefined,
      label: block.title ?? block.body ?? "",
    }))
    .filter((metric) => metric.label);

  return {
    heading: section.title ?? undefined,
    subheading: section.subtitle ?? undefined,
    quotes: quotes.length ? quotes : undefined,
    metrics: metrics.length ? metrics : undefined,
  };
}

export default async function HomePage() {
  const [pageContent, settings] = await Promise.all([
    fetchWebsitePage("home"),
    fetchWebsiteSettings(),
  ]);
  const heroContent = resolveHeroContent(pageContent);
  const socialProofContent = resolveSocialProofContent(pageContent);
  const footerContent = resolveFooterContent(settings);

  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <SectionScroller>
        <Hero content={heroContent} />
        <ProblemSolution />
        <ProductTour />
        <StorySection />
        <FeatureGroups />
        <UseCases />
        <SocialProof content={socialProofContent} />
        <PricingSection />
        <SecuritySection />
        <ContactSection />
      </SectionScroller>
      <LandingFooter content={footerContent} />
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
