"use client";

import { Rbac } from "../components/layout/app-shell";
import { useAuth } from "../providers";

export default function DashboardPage() {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Centrum dowodzenia
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Zbudowana baza pod migrację: spójny layout, kontekst organizacji i strażnicy uprawnień.
          </p>
        </div>
        <div className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
          <div className="font-semibold">Aktywna organizacja</div>
          <div>{session?.currentOrganization?.name}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Szybki start</div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Przejdź do kreatora grafików i sprawdź wielo-wybór, edycję zbiorczą i lokalne zapisy.
          </p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Spójny layout</div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Sidebar, nagłówek i selektor org dzielone przez wszystkie podstrony V2.
          </p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>API V2</div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Zaloguj się przez /v2/auth/login i odśwież profil /v2/auth/me z nagłówkiem X-Org-Id.
          </p>
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Uprawnienia i dostęp</div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Sekcje poniżej znikają, jeżeli rola w organizacji nie spełnia wymagań.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <Rbac roles={["OWNER", "ADMIN"]}>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Administracja</div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Dostęp do ustawień organizacji, płac i integracji.
              </p>
            </div>
          </Rbac>
          <Rbac roles={["OWNER", "ADMIN", "MANAGER"]}>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Planowanie</div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Pełny dostęp do kreatora grafików i publikacji zmian.
              </p>
            </div>
          </Rbac>
          <Rbac roles={["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]}>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Self-service</div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Widok zadań, powiadomień i zgłoszeń pracownika.
              </p>
            </div>
          </Rbac>
        </div>
      </div>
    </div>
  );
}
