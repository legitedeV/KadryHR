export interface WebsiteBlockContent {
  id: string;
  sectionId: string;
  type: string;
  title?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  extra?: Record<string, unknown> | null;
  order: number;
}

export interface WebsiteSectionContent {
  id: string;
  pageId: string;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  order: number;
  blocks: WebsiteBlockContent[];
}

export interface WebsitePageContent {
  id: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImageUrl?: string | null;
  isPublished: boolean;
  sections: WebsiteSectionContent[];
}

export interface WebsiteSettingsContent {
  id: string;
  contactEmails: string[];
  socialLinks?: Record<string, unknown> | null;
  footerLinks?: Record<string, unknown> | null;
  cookieBannerText?: string | null;
  cookiePolicyUrl?: string | null;
  privacyPolicyUrl?: string | null;
  termsOfServiceUrl?: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.kadryhr.pl/api";

export async function fetchWebsitePage(
  slug: string,
): Promise<WebsitePageContent | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/website/pages/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as WebsitePageContent;
  } catch {
    return null;
  }
}

export async function fetchWebsiteSettings(): Promise<WebsiteSettingsContent | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/website/settings`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as WebsiteSettingsContent;
  } catch {
    return null;
  }
}
