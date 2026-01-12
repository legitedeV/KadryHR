import type { Metadata } from "next";
import { MarketingHeader } from "@/components/MarketingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Bezpieczeństwo",
  description: "Jak KadryHR chroni dane kadrowe, wspiera role i spełnia wymagania RODO.",
  alternates: { canonical: "/security" },
};

const sections = [
  {
    title: "Przechowywanie danych",
    desc: "Dane przechowujemy w centrach danych w UE. Backupy wykonywane są cyklicznie i szyfrowane.",
  },
  {
    title: "Role i uprawnienia",
    desc: "Właściciel, manager i pracownik mają różne poziomy dostępu. Uprawnienia można precyzyjnie ustawić per lokalizacja.",
  },
  {
    title: "Logi i audyt",
    desc: "KadryHR zapisuje historię edycji grafików i wniosków. To ułatwia kontrolę zmian i zgodność z procedurami.",
  },
  {
    title: "Minimalizacja danych",
    desc: "Przechowujemy tylko dane niezbędne do planowania i rozliczeń. Na życzenie eksportujemy i usuwamy dane.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Bezpieczeństwo</p>
          <h1 className="text-4xl font-semibold text-surface-50">
            Zaufanie i zgodność od pierwszego dnia.
          </h1>
          <p className="text-lg text-surface-300">
            KadryHR jest projektowany z myślą o ochronie danych kadrowych. Ułatwiamy spełnienie wymogów RODO oraz procedur wewnętrznych.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-3xl border border-surface-800/60 bg-surface-900/60 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-surface-50">{section.title}</h2>
              <p className="mt-2 text-sm text-surface-300">{section.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-brand-800/60 bg-brand-950/40 p-6">
          <h2 className="text-xl font-semibold text-surface-50">Dokumenty</h2>
          <div className="mt-4 grid gap-3 text-sm text-surface-300 md:grid-cols-2">
            <a href="/polityka-prywatnosci" className="font-semibold text-brand-300 hover:text-brand-200">
              Polityka prywatności
            </a>
            <a href="/cookies" className="font-semibold text-brand-300 hover:text-brand-200">
              Polityka cookies
            </a>
            <a href="/regulamin" className="font-semibold text-brand-300 hover:text-brand-200">
              Regulamin
            </a>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
