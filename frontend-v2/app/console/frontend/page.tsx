"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetAdminConfig, apiUpdateAdminConfig } from "@/lib/api";
import { pushToast } from "@/lib/toast";

type FrontendConfigForm = {
  enableLandingTestimonials: boolean;
  enablePanelBetaFeatures: boolean;
  themeAccent: "emerald" | "cyan" | "violet";
  navigation: {
    showAudit: boolean;
    showReports: boolean;
    showBilling: boolean;
  };
};

const defaultFrontendConfig: FrontendConfigForm = {
  enableLandingTestimonials: true,
  enablePanelBetaFeatures: false,
  themeAccent: "emerald",
  navigation: {
    showAudit: true,
    showReports: true,
    showBilling: true,
  },
};

export default function ConsoleFrontendConfigPage() {
  const [config, setConfig] = useState<FrontendConfigForm>(defaultFrontendConfig);
  const [initialConfig, setInitialConfig] = useState<FrontendConfigForm>(defaultFrontendConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetAdminConfig()
      .then((data) => {
        if (cancelled) return;
        const incoming = data.frontendConfig as Partial<FrontendConfigForm>;
        const resolvedConfig = {
          ...defaultFrontendConfig,
          ...incoming,
          navigation: {
            ...defaultFrontendConfig.navigation,
            ...(incoming?.navigation ?? {}),
          },
        };
        setConfig(resolvedConfig);
        setInitialConfig(resolvedConfig);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Nie udało się pobrać konfiguracji.";
        pushToast({ title: "Błąd", description: message, variant: "error" });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(initialConfig),
    [config, initialConfig],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiUpdateAdminConfig({ frontendConfig: config });
      pushToast({ title: "Zapisano", description: "Konfiguracja frontend została zaktualizowana." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się zapisać konfiguracji.";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Frontend Config</h1>
        <p className="text-sm text-surface-400 mt-1">
          Bezpieczne ustawienia UI dla marketingu i panelu użytkownika.
        </p>
      </div>

      <div className="panel-card p-6 space-y-6">
        {loading ? (
          <p className="text-sm text-surface-400">Ładowanie konfiguracji...</p>
        ) : (
          <>
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-400">Landing</h2>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
                <div>
                  <p className="text-sm font-medium text-surface-100">Sekcja opinii klientów</p>
                  <p className="text-xs text-surface-400">Pokazuj referencje na stronie głównej.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableLandingTestimonials}
                  onChange={(event) =>
                    setConfig((prev) => ({ ...prev, enableLandingTestimonials: event.target.checked }))
                  }
                  className="h-5 w-5 accent-brand-500"
                />
              </label>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-400">Panel</h2>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
                <div>
                  <p className="text-sm font-medium text-surface-100">Beta funkcje panelu</p>
                  <p className="text-xs text-surface-400">Włącz eksperymentalne moduły dla wybranych kont.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enablePanelBetaFeatures}
                  onChange={(event) =>
                    setConfig((prev) => ({ ...prev, enablePanelBetaFeatures: event.target.checked }))
                  }
                  className="h-5 w-5 accent-brand-500"
                />
              </label>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-400">Motyw</h2>
              <div className="rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
                <label className="text-sm font-medium text-surface-100">Akcent kolorystyczny</label>
                <select
                  value={config.themeAccent}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      themeAccent: event.target.value as FrontendConfigForm["themeAccent"],
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-surface-700/70 bg-surface-950 px-3 py-2 text-sm text-surface-100"
                >
                  <option value="emerald">Emerald</option>
                  <option value="cyan">Cyan</option>
                  <option value="violet">Violet</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-400">Nawigacja panelu</h2>
              {[
                { key: "showAudit", label: "Audit log" },
                { key: "showReports", label: "Raporty" },
                { key: "showBilling", label: "Rozliczenia" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-100">{item.label}</p>
                    <p className="text-xs text-surface-400">Steruj widocznością w menu.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.navigation[item.key as keyof FrontendConfigForm["navigation"]]}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        navigation: {
                          ...prev.navigation,
                          [item.key]: event.target.checked,
                        },
                      }))
                    }
                    className="h-5 w-5 accent-brand-500"
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={saving || loading || !isDirty}
          onClick={handleSave}
          className="btn-primary px-5 py-2 disabled:opacity-60"
        >
          {saving ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
      </div>
    </div>
  );
}
