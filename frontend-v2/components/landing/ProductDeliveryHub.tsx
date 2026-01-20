"use client";

import { Reveal } from "@/components/motion/Reveal";

const coreModules = [
  "Multi-tenant (organizacje, lokalizacje)",
  "Role & uprawnienia (owner / leader / manager / employee) — granularne",
  "Pracownicy: CRUD + aktywacja/dezaktywacja + statusy",
  "Grafik tygodniowy: drag&drop, publikacja, walidacje obsady",
  "Dyspozycyjność: okna czasowe, składanie, edycja, zamykanie okien, podgląd w grafiku",
  "Wnioski (urlopy/zwolnienia): składanie, edycja, workflow akceptacji, historia, salda",
  "Powiadomienia: in-app + e-mail (SMS/push jako etap 2)",
  "AuditLog: podgląd + filtry + detale",
];

const opsModules = [
  "Dokumenty pracownicze: upload, download, foldery, uprawnienia",
  "Umowy i wynagrodzenia: podsumowania, historia, wsparcie pod PL prawo pracy (etapami)",
  "Eksporty: CSV/XLSX/PDF (grafik, lista pracowników, ewidencja)",
  "Integracje: biuro rachunkowe (export), API webhooks",
];

const wowModules = [
  "Personalizacja dashboardu (widgety, kolejność, układ)",
  "Inteligentne podpowiedzi grafiku (w oparciu o dyspozycje + reguły)",
  "PWA/mobile-first panel pracownika",
];

const qualityBar = [
  "Panel /panel/* ma wyglądać jak landing: spójne kolory, typografia, komponenty, spacing.",
  "Dark mode premium, light mode: nie biały jak śnieg → beż/cream + akcent (np. różowy zamiast zielonego).",
  "Zero “demo feeling”: wszystkie tabelki, panele i formularze muszą wyglądać jak produkt gotowy do sprzedaży.",
  "Komponenty: reużywalne, tokeny kolorów, brak hardcode.",
  "Dostępność: kontrast, focus states, prefers-reduced-motion.",
];

const priorities = [
  {
    label: "P0 — Krytyczne (blokujące produkt)",
    items: [
      "Dyspozycje: owner musi móc zamknąć okno, edytować, usuwać, przeglądać statusy",
      "Pracownicy: dezaktywacja/usunięcie, status zatrudnienia",
      "Wnioski: pełny flow pracownik → admin (zatwierdź/odrzuć) + edycja po wysłaniu (do czasu decyzji)",
      "Naprawy wizualne dark mode (białe elementy), /panel/powiadomienia działa",
      "Grafik: poprawny układ tabeli (dni tygodnia w nagłówku, pracownicy w wierszach), więcej miejsca (bez bezsensownego scrolla)",
    ],
  },
  {
    label: "P1 — Ważne (sprzedaż + przewaga)",
    items: [
      "Uprawnienia granularne: role → permissions UI + backend policy",
      "Dashboard: mini podgląd 3 dni + personalizacja widgetów",
      "AuditLog: pełna integracja front/back (filtry, detale, powiązane encje)",
      "Szablony zmian + kolory zmian + ostrzeżenia obsady",
    ],
  },
  {
    label: "P2 — Rozwój",
    items: [
      "Dokumenty pracownika",
      "Umowy i rozliczenia (etap 1: proste podsumowanie)",
      "Raporty i eksporty",
      "PWA pracownika",
    ],
  },
];

const successMetrics = [
  "⏱️ Time-to-build: zrobienie grafiku na tydzień < 3 min (dla 6–12 osób)",
  "✅ Adoption: >70% pracowników składa dyspozycje w oknie",
  "🔁 Retencja: właściciel wraca do panelu min. 4×/tydzień",
  "📉 Bug rate: brak krytycznych błędów w flow dyspozycje/wnioski/grafik",
  "🚀 Performance: panel ładuje się < 1.5s TTFB na VPS produkcyjny",
];

const definitionOfDone = [
  "Feature działa end-to-end: backend + frontend + walidacje + stany pustki + error handling",
  "UI spójny z design systemem, działa w dark/light",
  "Testy minimalne: e2e smoke lub unit/integration gdzie ma sens",
  "Brak regresji w build/deploy (Next build + Nest build)",
  "Zaktualizowana dokumentacja (README/notes + changelog w PR)",
];

const risks = [
  "Nie robimy “wszystkiego na raz” w rozliczeniach PL prawa pracy — etapujemy.",
  "Nie dodajemy ciężkich zależności do animacji bez potrzeby.",
  "Nie merge’ujemy bez przeglądu diffów (zero “YOLO merge”).",
];

const roadmap = [
  {
    label: "Sprint A (Stabilizacja produktu)",
    items: ["Dyspozycje", "Wnioski", "Pracownicy (statusy)", "UI dark/light", "Powiadomienia", "Grafik UX"],
  },
  {
    label: "Sprint B (Przewaga nad konkurencją)",
    items: ["Permissions", "Dashboard widgety", "AuditLog full", "Szablony zmian", "Walidacje obsady"],
  },
  {
    label: "Sprint C (Ops/HR)",
    items: ["Dokumenty + kontrakty", "Proste podsumowanie wynagrodzeń", "Eksporty"],
  },
  {
    label: "Sprint D (Mobile)",
    items: ["PWA pracownika + push"],
  },
];

export function ProductDeliveryHub() {
  return (
    <section className="landing-section border-t border-surface-900/80 px-6 py-24" id="product-delivery-hub">
      <div className="mx-auto max-w-6xl space-y-12">
        <Reveal className="space-y-5 text-center" delay={80} distance={18}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
            KadryHR.pl — Product & Delivery Hub
          </p>
          <h2 className="text-3xl font-semibold text-surface-50 md:text-4xl">
            KadryHR to produkt HR dla retail/SMB, w którym grafiki, dyspozycyjność i HR ops działają bez tarcia.
          </h2>
          <p className="text-surface-300">
            North Star: planowanie pracy i obsługa pracownika ma być „bez bólu”, szybkie i estetyczne.
          </p>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={120} distance={16}>
            <h3 className="text-xl font-semibold text-surface-50">1) Cel projektu</h3>
            <p className="mt-3 text-sm text-surface-300">
              KadryHR.pl to nowoczesny system do zarządzania personelem (grafiki, dyspozycyjność, wnioski,
              powiadomienia, dokumenty, rozliczenia). Celem jest przebić UX i kompletność funkcji konkurencji
              w obszarach: grafik + dyspozycje + HR ops + automatyzacje.
            </p>
          </Reveal>
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={160} distance={16}>
            <h3 className="text-xl font-semibold text-surface-50">2) Zakres (Modules)</h3>
            <div className="mt-4 space-y-4 text-sm text-surface-300">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Core (MVP+)</p>
                <ul className="mt-2 space-y-2">
                  {coreModules.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Ops & HR</p>
                <ul className="mt-2 space-y-2">
                  {opsModules.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Produkt “Wow”</p>
                <ul className="mt-2 space-y-2">
                  {wowModules.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={200} distance={18}>
            <h3 className="text-xl font-semibold text-surface-50">3) Standard UI/UX (Quality Bar)</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {qualityBar.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={240} distance={18}>
            <h3 className="text-xl font-semibold text-surface-50">4) Priorytety (najbliższe tygodnie)</h3>
            <div className="mt-4 space-y-4 text-sm text-surface-300">
              {priorities.map((priority) => (
                <div key={priority.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">{priority.label}</p>
                  <ul className="mt-2 space-y-2">
                    {priority.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={280} distance={18}>
            <h3 className="text-xl font-semibold text-surface-50">5) Metryki sukcesu</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {successMetrics.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={320} distance={18}>
            <h3 className="text-xl font-semibold text-surface-50">6) Definition of Done (DoD)</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {definitionOfDone.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={360} distance={18}>
            <h3 className="text-xl font-semibold text-surface-50">7) Ryzyka / Anti-goals</h3>
            <ul className="mt-4 space-y-2 text-sm text-surface-300">
              {risks.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={400} distance={18}>
            <h3 className="text-xl font-semibold text-surface-50">8) Roadmap (proponowana)</h3>
            <div className="mt-4 space-y-4 text-sm text-surface-300">
              {roadmap.map((phase) => (
                <div key={phase.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">{phase.label}</p>
                  <ul className="mt-2 space-y-2">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6" delay={440} distance={18}>
          <h3 className="text-xl font-semibold text-surface-50">9) Szybkie linki</h3>
          <div className="mt-4 grid gap-4 text-sm text-surface-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Repo</p>
              <p className="mt-2">legitedeV/KadryHR</p>
            </div>
            <div className="rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Environments</p>
              <p className="mt-2">Production (VPS) + staging (opcjonalnie)</p>
            </div>
            <div className="rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Test login</p>
              <p className="mt-2">owner@seed.local / ChangeMe123!</p>
            </div>
            <div className="rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Definicja sukcesu</p>
              <p className="mt-2">Grafik na tydzień w &lt; 3 min + powtarzalne dyspozycje.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
