"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetAdminConfig, apiUpdateAdminConfig } from "@/lib/api";
import { pushToast } from "@/lib/toast";

type BackendConfigForm = {
  maintenanceMode: boolean;
  newsletterEnabled: boolean;
  maxEmployeesTrial: number;
  schedulerExperimental: boolean;
};

const defaultBackendConfig: BackendConfigForm = {
  maintenanceMode: false,
  newsletterEnabled: true,
  maxEmployeesTrial: 50,
  schedulerExperimental: false,
};

export default function ConsoleBackendConfigPage() {
  const [config, setConfig] = useState<BackendConfigForm>(defaultBackendConfig);
  const [initialConfig, setInitialConfig] = useState<BackendConfigForm>(defaultBackendConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiGetAdminConfig()
      .then((data) => {
        if (cancelled) return;
        const incoming = data.backendConfig as Partial<BackendConfigForm>;
        const resolvedConfig = {
          ...defaultBackendConfig,
          ...incoming,
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
      await apiUpdateAdminConfig({ backendConfig: config });
      pushToast({ title: "Zapisano", description: "Konfiguracja backend została zaktualizowana." });
      setInitialConfig(config);
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
        <h1 className="text-2xl font-semibold text-surface-50">Backend Config</h1>
        <p className="text-sm text-surface-400 mt-1">
          Systemowe flagi, limity i przełączniki bezpieczeństwa.
        </p>
      </div>

      <div className="panel-card p-6 space-y-6">
        {loading ? (
          <p className="text-sm text-surface-400">Ładowanie konfiguracji...</p>
        ) : (
          <>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
              <div>
                <p className="text-sm font-medium text-surface-100">Maintenance mode</p>
                <p className="text-xs text-surface-400">Włącz tryb konserwacji dla aplikacji.</p>
              </div>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, maintenanceMode: event.target.checked }))
                }
                className="h-5 w-5 accent-brand-500"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
              <div>
                <p className="text-sm font-medium text-surface-100">Newsletter module</p>
                <p className="text-xs text-surface-400">Zezwalaj na zapisy do newslettera.</p>
              </div>
              <input
                type="checkbox"
                checked={config.newsletterEnabled}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, newsletterEnabled: event.target.checked }))
                }
                className="h-5 w-5 accent-brand-500"
              />
            </label>

            <div className="rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
              <label className="text-sm font-medium text-surface-100">Limit pracowników (trial)</label>
              <input
                type="number"
                min={1}
                value={config.maxEmployeesTrial}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    maxEmployeesTrial: Number(event.target.value || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-surface-700/70 bg-surface-950 px-3 py-2 text-sm text-surface-100"
              />
            </div>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
              <div>
                <p className="text-sm font-medium text-surface-100">Eksperymentalny scheduler</p>
                <p className="text-xs text-surface-400">Włącz nowe algorytmy planowania zmian.</p>
              </div>
              <input
                type="checkbox"
                checked={config.schedulerExperimental}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, schedulerExperimental: event.target.checked }))
                }
                className="h-5 w-5 accent-brand-500"
              />
            </label>
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
