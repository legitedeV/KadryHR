import Link from "next/link";

export type FooterLinkGroup = { label: string; links: Array<{ label: string; href: string }> };

export type LandingFooterContent = {
  description?: string;
  groups?: FooterLinkGroup[];
  legalLinks?: Array<{ label: string; href: string }>;
  copyright?: string;
  tagline?: string;
};

const fallbackGroups: FooterLinkGroup[] = [
  {
    label: "Produkt",
    links: [
      { label: "Produkt", href: "/#produkt" },
      { label: "Cennik", href: "/cennik" },
      { label: "Bezpieczeństwo", href: "/security" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  {
    label: "Dla zespołów",
    links: [
      { label: "Załóż konto", href: "/register" },
      { label: "Logowanie", href: "/login" },
      { label: "Newsletter", href: "/newsletter" },
    ],
  },
];

const fallbackLegalLinks = [
  { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
  { label: "Cookies", href: "/cookies" },
  { label: "Regulamin", href: "/regulamin" },
];

export function LandingFooter({ content }: { content?: LandingFooterContent }) {
  const groups = content?.groups?.length ? content.groups : fallbackGroups;
  const legalLinks = content?.legalLinks?.length ? content.legalLinks : fallbackLegalLinks;

  return (
    <footer className="border-t border-surface-800/60 bg-surface-950/60 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-surface-400">KadryHR</p>
          <p className="text-sm text-surface-300">
            {content?.description ??
              "KadryHR porządkuje grafiki zmianowe, czas pracy i urlopy dla sieci retail oraz usług."}
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.label} className="space-y-2 text-sm text-surface-300">
            <p className="font-semibold text-surface-100">{group.label}</p>
            {group.links.map((link) => (
              <Link key={link.label} href={link.href} className="block hover:text-surface-50">
                {link.label}
              </Link>
            ))}
          </div>
        ))}
        <div className="space-y-2 text-sm text-surface-300">
          <p className="font-semibold text-surface-100">Legal</p>
          {legalLinks.map((link) => (
            <Link key={link.label} href={link.href} className="block hover:text-surface-50">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 px-6 text-xs text-surface-400 md:flex-row md:items-center md:justify-between">
        <span>{content?.copyright ?? "© 2026 KadryHR. Wszelkie prawa zastrzeżone."}</span>
        <span>{content?.tagline ?? "Budujemy spokój operacyjny dla zespołów zmianowych."}</span>
      </div>
    </footer>
  );
}
