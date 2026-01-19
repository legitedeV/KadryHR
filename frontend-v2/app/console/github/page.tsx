"use client";

export default function ConsoleGithubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">GitHub & Deploy</h1>
        <p className="text-sm text-surface-400 mt-1">
          Podgląd zmian w repozytorium i ostatnich wdrożeń.
        </p>
      </div>

      <div className="panel-card p-6 space-y-4">
        <div className="rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
          <p className="text-sm font-semibold text-surface-100">Integracja GitHub</p>
          <p className="text-xs text-surface-400 mt-2">
            Aby wyświetlać ostatnie PR-y i commity, skonfiguruj token w backendzie
            (np. poprzez bezpieczny sekret środowiskowy) i dodaj odpowiedni endpoint.
          </p>
        </div>

        <div className="rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
          <p className="text-sm font-semibold text-surface-100">Ostatnie wdrożenia</p>
          <p className="text-xs text-surface-400 mt-2">
            Brak danych. Podłącz źródło informacji o deployach (CI/CD, PM2, lub rejestr release&apos;ów).
          </p>
        </div>
      </div>
    </div>
  );
}
