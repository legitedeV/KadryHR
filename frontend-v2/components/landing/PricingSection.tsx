import Link from "next/link";

const pricingTiers = [
  { label: "Do 10 pracowników", detail: "start dla małych zespołów" },
  { label: "11-25 pracowników", detail: "pełny rytm zmian" },
  { label: "26-50 pracowników", detail: "wiele lokalizacji" },
  { label: "Powyżej 50", detail: "model enterprise" },
];

export function PricingSection() {
  return (
    <section id="cennik" className="relative bg-[#F7F9FB] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F7F9FB] to-[#FFFFFF]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              Oferta
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-surface-900 sm:text-4xl">
              Jeden plan, który rośnie razem z zespołem.
            </h2>
            <p className="mt-4 text-surface-600">
              KadryHR dostosowuje się do liczby pracowników i lokalizacji. Bez ukrytych
              modułów i bez dopłat za podstawowe funkcje.
            </p>
          </div>
          <div className="rounded-[2.5rem] border border-emerald-300/30 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-transparent p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
              Plan Biznes
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-surface-900">KadryHR Business</h3>
            <p className="mt-2 text-sm text-surface-600">
              Grafik, RCP, urlopy i raporty w jednym pakiecie. Wsparcie wdrożeniowe i
              opiekun klienta.
            </p>
            <div className="mt-6 space-y-3 text-sm text-surface-600">
              <div className="flex items-center justify-between rounded-2xl border border-surface-300 bg-white px-4 py-3">
                <span>Wdrożenie i migracja danych</span>
                <span className="text-emerald-200">W cenie</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-surface-300 bg-white px-4 py-3">
                <span>Obsługa wielu lokalizacji</span>
                <span className="text-emerald-200">Bez limitu</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-surface-300 bg-white px-4 py-3">
                <span>API i eksporty</span>
                <span className="text-emerald-200">Standard</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#lead-form"
                className="rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-surface-900 transition hover:bg-emerald-200"
              >
                Umów prezentację
              </a>
              <Link
                href="/register"
                className="rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition hover:border-surface-500 hover:text-surface-900"
              >
                Zobacz panel demo
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-surface-300 bg-surface-100 p-6">
          <div className="flex flex-wrap gap-6 text-sm text-surface-600">
            {pricingTiers.map((tier) => (
              <div
                key={tier.label}
                className="flex min-w-[200px] flex-1 items-center justify-between rounded-2xl border border-surface-300 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-surface-900">{tier.label}</p>
                  <p className="text-xs text-surface-500">{tier.detail}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  Elastycznie
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
