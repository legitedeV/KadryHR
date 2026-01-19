"use client";

import { useEffect, useState } from "react";
import { apiGetAdminStatus, AdminSystemStatus } from "@/lib/api";
import { pushToast } from "@/lib/toast";

export default function ConsoleStatusPage() {
  const [status, setStatus] = useState<AdminSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetAdminStatus()
      .then((data) => {
        if (cancelled) return;
        setStatus(data);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Nie udało się pobrać statusu.";
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

  const cardClass = (value: string) =>
    value === "ok" ? "border-emerald-500/40 text-emerald-200" : "border-rose-500/40 text-rose-200";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Status systemu</h1>
        <p className="text-sm text-surface-400 mt-1">
          Kontrola stanu API, bazy danych i kluczowych usług.
        </p>
      </div>

      <div className="panel-card p-6">
        {loading && <p className="text-sm text-surface-400">Sprawdzanie statusu...</p>}
        {!loading && status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-4 bg-surface-900/40 ${cardClass(status.api)}`}>
              <p className="text-xs uppercase tracking-wide">API</p>
              <p className="text-lg font-semibold mt-2">{status.api === "ok" ? "Działa" : "Błąd"}</p>
            </div>
            <div className={`rounded-2xl border p-4 bg-surface-900/40 ${cardClass(status.database)}`}>
              <p className="text-xs uppercase tracking-wide">Baza danych</p>
              <p className="text-lg font-semibold mt-2">
                {status.database === "ok" ? "Połączono" : "Problem z połączeniem"}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-800/70 p-4 bg-surface-900/40 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-surface-500">Ostatnia kontrola</p>
              <p className="text-sm text-surface-100 mt-2">{new Date(status.checkedAt).toLocaleString("pl-PL")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
