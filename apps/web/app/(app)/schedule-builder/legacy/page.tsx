import { ModulePlaceholder } from "../../../components/module-placeholder";

export default function LegacyScheduleFallbackPage() {
  return (
    <div className="space-y-6">
      <ModulePlaceholder
        title="Kreator grafików — tryb legacy"
        description="Awaryjny dostęp do poprzedniego kreatora grafików (Vite). Używaj tylko jeśli nowy kreator nie obsługuje pełnego flow."
        status="Fallback"
        ready={["Reverse proxy na /schedule-builder/legacy", "Dane grafików w API", "Publikacja z pulpitu"]}
        inProgress={["Publikacja i wersjonowanie w V2", "Reguły organizacji/roli", "Eksport PDF/CSV"]}
        planned={["Migracja pełnego UI do Next.js", "Tryb offline dla kiosków", "Szablony grafików"]}
        cta={{ label: "Otwórz tryb legacy", href: "/schedule-builder/legacy" }}
        secondaryCta={{ label: "Nowy kreator", href: "/schedule-builder" }}
      />
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Instrukcja
        </p>
        <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li>1. Jeśli publikacja w V2 jest niedostępna, skorzystaj z trybu legacy pod reverse proxy.</li>
          <li>2. Po publikacji w legacy zweryfikuj dane czasu pracy i urlopów.</li>
          <li>3. Zgłoś brakujące reguły (org/rola), aby przenieść je do nowego kreatora.</li>
        </ul>
      </div>
    </div>
  );
}
