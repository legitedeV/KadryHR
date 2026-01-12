import { MarketingHeader } from "@/components/MarketingHeader";
import { CTASection } from "@/components/landing/CTASection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { Hero } from "@/components/landing/Hero";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LogosStrip } from "@/components/landing/LogosStrip";
import { SecondaryHero } from "@/components/landing/SecondaryHero";

const trustedClients = [
  {
    name: "Forest Catering",
    href: "https://www.forestcatering.pl/",
    logo: "https://www.forestcatering.pl/modules/jscomposer/uploads/forest_logo_min.png",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <MarketingHeader />

      <main className="relative overflow-hidden">
        <section className="relative">
          <div className="hero-aurora" />
          <div className="floating-orb orb-slow left-[-40px] top-10 h-32 w-32 bg-brand-300/50" />
          <div className="floating-orb orb-fast right-20 top-16 h-20 w-20 bg-accent-300/60" />
          <div className="floating-orb right-[-20px] bottom-10 h-28 w-28 bg-emerald-300/40" />

          <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-surface-700 shadow-soft ring-1 ring-white/70 dark:bg-surface-900/60 dark:text-surface-200 dark:ring-surface-700/60">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  KadryHR • inteligentne grafiki
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-surface-900 dark:text-surface-50">
                    Panel, który <span className="bg-gradient-to-r from-brand-500 via-accent-500 to-emerald-500 bg-clip-text text-transparent">synchronizuje ludzi</span> i zmiany.
                  </h1>
                  <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
                    Nowoczesny system do grafików, wniosków i komunikacji. Animowane alerty, automatyczna kontrola obsady i perfekcyjny UI.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/login" className="btn-primary btn-hero text-base px-6 py-3">
                    Start demo
                  </Link>
                  <Link href="/cennik" className="btn-secondary btn-hero-outline text-base px-6 py-3">
                    Zobacz pakiety
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 text-center shadow-soft dark:border-surface-700/60 dark:bg-surface-900/60"
                    >
                      <p className="text-xs uppercase tracking-wider text-surface-500 dark:text-surface-400">{stat.label}</p>
                      <p className="mt-2 text-lg font-bold text-surface-900 dark:text-surface-50">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="glass-panel rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-surface-500 dark:text-surface-400">Live Control</p>
                      <p className="text-lg font-bold text-surface-900 dark:text-surface-50">Wtorek • ZMIANA PROMOCJI</p>
                    </div>
                    <span className="badge badge-warning">Wymagane 2 osoby</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      { title: "Popołudnie", people: "Obsada 1/2", status: "Brak 1 osoby", color: "text-rose-500" },
                      { title: "Rano", people: "Obsada 2/2", status: "OK", color: "text-emerald-500" },
                      { title: "Dostawa", people: "Obsada 1/1", status: "OK", color: "text-emerald-500" },
                    ].map((row) => (
                      <div key={row.title} className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm shadow-soft dark:border-surface-700/60 dark:bg-surface-900/60">
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-surface-50">{row.title}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">{row.people}</p>
                        </div>
                        <span className={`text-xs font-semibold ${row.color}`}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/70 px-4 py-3 text-xs text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/30 dark:text-brand-200">
                    ✨ KadryHR podpowiada: dodaj jeszcze 1 osobę na popołudnie i wyślij powiadomienie do zespołu.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">Najważniejsze</p>
              <h2 className="section-title mt-2">Doświadczenie premium dla właścicieli i menedżerów</h2>
            </div>
            <Link
              href="/panel/dashboard"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-2"
            >
              Zobacz panel
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {highlightCards.map((card) => (
              <div key={card.title} className="card-hover p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-lg ring-1 ring-brand-100/80 dark:from-brand-950/50 dark:to-accent-950/50 dark:ring-brand-800/50">
                    {card.icon}
                  </span>
                  <p className="font-semibold text-surface-900 dark:text-surface-50">{card.title}</p>
                </div>
                <p className="mt-4 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div key={step.title} className="card p-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-brand-100/50 dark:bg-brand-900/20" />
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">{step.accent}</span>
                <p className="mt-2 text-lg font-bold text-surface-900 dark:text-surface-50">{step.title}</p>
                <p className="mt-3 text-sm text-surface-600 dark:text-surface-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="card p-8 relative overflow-hidden">
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-900/30" />
            <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-accent-200/40 blur-3xl dark:bg-accent-900/20" />
            <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <p className="section-label">Experience</p>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-2">KadryHR jak luksusowy cockpit</h2>
                <p className="text-sm text-surface-600 dark:text-surface-300 mt-3">
                  Animowane statusy, interaktywne przyciski i powiadomienia, które naprawdę działają. W stylu Apple/Sony.
                </p>
                <div className="mt-6 space-y-4">
                  {experienceTiles.map((tile) => (
                    <div key={tile.title} className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center dark:bg-brand-950/50 dark:text-brand-300">
                        {tile.tag}
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-surface-50">{tile.title}</p>
                        <p className="text-sm text-surface-600 dark:text-surface-300">{tile.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-surface-200/80 bg-white/80 px-5 py-4 text-sm shadow-soft dark:border-surface-800/80 dark:bg-surface-900/60">
                  <p className="font-semibold text-surface-900 dark:text-surface-50">📍 3 lokalizacje, 1 panel</p>
                  <p className="mt-2 text-surface-600 dark:text-surface-300">Wszystkie grafiki i pracownicy zsynchronizowani w jednej osi czasu.</p>
                </div>
                <div className="rounded-2xl border border-surface-200/80 bg-white/80 px-5 py-4 text-sm shadow-soft dark:border-surface-800/80 dark:bg-surface-900/60">
                  <p className="font-semibold text-surface-900 dark:text-surface-50">🧠 AI ready</p>
                  <p className="mt-2 text-surface-600 dark:text-surface-300">Sugestie obsady bazują na poprzednich tygodniach i dostępności.</p>
                </div>
                <div className="rounded-2xl border border-surface-200/80 bg-white/80 px-5 py-4 text-sm shadow-soft dark:border-surface-800/80 dark:bg-surface-900/60">
                  <p className="font-semibold text-surface-900 dark:text-surface-50">⚙️ Integracje</p>
                  <p className="mt-2 text-surface-600 dark:text-surface-300">Eksporty CSV, integracje z payroll i szybkie API.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="card-hover p-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-surface-50">{item.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Zweryfikowana opinia</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">“{item.quote}”</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="card p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-label">Zaufali nam</p>
                <h2 className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-50">
                  Marki, które rozwijają zespoły z KadryHR
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                {trustedClients.map((client) => (
                  <a
                    key={client.name}
                    href={client.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-white/80 px-5 py-3 text-sm font-semibold text-surface-700 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated dark:border-surface-800/70 dark:bg-surface-900/60 dark:text-surface-100"
                  >
                    <img
                      src={client.logo}
                      alt={`${client.name} logo`}
                      className="h-10 w-auto object-contain"
                      loading="lazy"
                    />
                    <span>{client.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="card p-8 shadow-elevated">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              <div>
                <p className="text-lg font-bold text-surface-900 dark:text-surface-50">Zostaw kontakt — oddzwonimy</p>
                <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">Przetestuj KadryHR w realnym grafiku. Pomożemy wystartować w 1 dzień.</p>
              </div>
              <LeadCaptureForm />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="card p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-brand-50/60 to-accent-50/40 dark:from-brand-950/30 dark:to-accent-950/30">
            <div>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-50">Gotowy na nowy standard grafików?</p>
              <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">Startuj bez ryzyka. Demo w 15 minut.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="btn-primary btn-hero">
                Rozpocznij
              </Link>
              <Link href="/kontakt" className="btn-secondary btn-hero-outline">
                Porozmawiajmy
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
