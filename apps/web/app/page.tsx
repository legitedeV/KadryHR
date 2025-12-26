import Link from "next/link";

const coverage = [
  { label: "Logowanie / /login", state: "OK" },
  { label: "Pulpit /app", state: "OK" },
  { label: "Self-service", state: "OK" },
  { label: "Czas pracy / Urlopy", state: "OK" },
  { label: "Kreator grafików", state: "PARTIAL" },
  { label: "Landing / public", state: "PARTIAL" },
  { label: "Rejestracja / zaproszenia", state: "MISSING" },
  { label: "Centrum zadań / chat", state: "MISSING" },
  { label: "Ustawienia i administracja", state: "MISSING" },
];

const actions = [
  { label: "Zaloguj się", href: "/login", emphasis: true },
  { label: "Utwórz konto", href: "/register" },
  { label: "Sprawdź status", href: "/health" },
  { label: "Przejdź do pulpitu", href: "/app" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, var(--page-gradient-start), var(--page-gradient-end))" }}>
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
        <header className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center text-xs font-semibold tracking-wide uppercase rounded-full px-3 py-1"
              style={{ background: "rgba(var(--theme-primary-rgb),0.08)", color: "var(--theme-primary)" }}>
              KadryHR V2 • Road to parity
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              Zmodernizowany HR & Payroll<br />gotowy do migracji z legacy.
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Publiczny landing i przewodnik migracji. Sprawdzaj stan modułów, przechodź do pulpitu V2
              i udostępniaj rejestrację lub zaproszenia dla nowych organizacji.
            </p>
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={action.emphasis ? "btn-primary" : "text-sm font-semibold px-4 py-3 rounded-lg border"}
                  style={
                    action.emphasis
                      ? { paddingInline: "1.25rem" }
                      : { borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--surface-primary)" }
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Snapshot migracji
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Funkcjonalne jądro V2 działa. Do parytetu brakuje landing page, rejestracji/invite oraz pełnych modułów
                administracyjnych i komunikacyjnych.
              </p>
            </div>
          </div>

          <div className="app-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Pokrycie ścieżek
              </p>
              <span className="text-xs rounded-full px-3 py-1" style={{ background: "var(--surface-tertiary)", color: "var(--text-tertiary)" }}>
                Aktualizacja V2
              </span>
            </div>
            <div className="space-y-3">
              {coverage.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--surface-secondary)" }}>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{row.label}</div>
                  <StatusPill state={row.state} />
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Priorytety na sprint
              </p>
              <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>• Landing z CTA rejestracji i health-checkiem API</li>
                <li>• Rejestracja/self-onboarding + obsługa zaproszeń</li>
                <li>• Publikacja grafików, centrum powiadomień i skrzynka zadań</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Administracja", "Operacje", "Komunikacja"].map((pillar) => (
            <div
              key={pillar}
              className="rounded-xl border p-5 shadow-sm"
              style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {pillar}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {pillar === "Administracja"
                  ? "Ustawienia organizacji, role/uprawnienia, webhooks i raporty do spięcia z V2 API."
                  : pillar === "Operacje"
                    ? "Grafiki, urlopy, czas pracy i rejestracja/QR — gotowe do publikacji i migracji."
                    : "Chat, powiadomienia, zadania i profile pracowników w trakcie projektowania."}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ state }: { state: "OK" | "PARTIAL" | "MISSING" }) {
  const palette = {
    OK: { background: "rgba(34,197,94,0.14)", color: "#15803d" },
    PARTIAL: { background: "rgba(234,179,8,0.16)", color: "#854d0e" },
    MISSING: { background: "rgba(239,68,68,0.12)", color: "#b91c1c" },
  } as const;

  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={palette[state]}>
      {state}
    </span>
  );
}
