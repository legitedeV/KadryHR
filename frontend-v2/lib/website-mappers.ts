import type { LandingFooterContent } from "@/components/landing/LandingFooter";
import type { WebsiteSettingsContent } from "@/lib/website-content";

export function resolveFooterContent(
  settings: WebsiteSettingsContent | null,
): LandingFooterContent | undefined {
  if (!settings) return undefined;

  const footerLinks = Array.isArray(settings.footerLinks)
    ? (settings.footerLinks as Array<{
        label: string;
        links: Array<{ label: string; href: string }>;
      }>)
    : null;

  const legalLinks: Array<{ label: string; href: string }> = [];
  if (settings.privacyPolicyUrl) {
    legalLinks.push({
      label: "Polityka prywatności",
      href: settings.privacyPolicyUrl,
    });
  }
  if (settings.cookiePolicyUrl) {
    legalLinks.push({ label: "Cookies", href: settings.cookiePolicyUrl });
  }
  if (settings.termsOfServiceUrl) {
    legalLinks.push({ label: "Regulamin", href: settings.termsOfServiceUrl });
  }

  return {
    groups: footerLinks ?? undefined,
    legalLinks: legalLinks.length ? legalLinks : undefined,
  };
}
