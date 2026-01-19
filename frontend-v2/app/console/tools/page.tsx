"use client";

export default function ConsoleToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Tools</h1>
        <p className="text-sm text-surface-400 mt-1">
          Operacyjne narzędzia administracyjne. Wszystkie akcje będą audytowane po podłączeniu
          endpointów backendowych.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-surface-100">Sandbox organisation</h2>
          <p className="text-sm text-surface-400">
            Utwórz przykładową organizację z pracownikami, lokalizacjami i zmianami.
          </p>
          <button className="btn-primary px-4 py-2 text-sm" type="button">
            Generuj sandbox
          </button>
        </div>
        <div className="panel-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-surface-100">Impersonacja</h2>
          <p className="text-sm text-surface-400">
            Przejdź do panelu jako wybrany użytkownik (z audytem i wylogowaniem).
          </p>
          <button className="btn-secondary px-4 py-2 text-sm" type="button">
            Rozpocznij impersonację
          </button>
        </div>
        <div className="panel-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-surface-100">Cache & Jobs</h2>
          <p className="text-sm text-surface-400">
            Wyczyść cache i uruchom ponownie krytyczne zadania w tle.
          </p>
          <button className="btn-secondary px-4 py-2 text-sm" type="button">
            Odśwież cache
          </button>
        </div>
      </div>
    </div>
  );
}
