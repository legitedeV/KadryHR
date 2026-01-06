"use client";

import { useEffect, useState, useCallback } from "react";
import { apiListAuditLogs, AuditLogEntry, AuditLogQuery } from "@/lib/api";
import { pushToast } from "@/lib/toast";

const actionLabels: Record<string, string> = {
  CREATE: "Utworzenie",
  UPDATE: "Aktualizacja",
  DELETE: "Usunięcie",
  LOGIN: "Logowanie",
  LOGOUT: "Wylogowanie",
  PUBLISH: "Publikacja",
  APPROVE: "Zatwierdzenie",
  REJECT: "Odrzucenie",
};

const entityTypeLabels: Record<string, string> = {
  shift: "Zmiana",
  employee: "Pracownik",
  "leave-request": "Wniosek urlopowy",
  schedule: "Grafik",
  location: "Lokalizacja",
  notification: "Powiadomienie",
  user: "Użytkownik",
};

function formatActorName(actor?: AuditLogEntry["actor"]): string {
  if (!actor) return "System";
  const name = `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim();
  return name || actor.email;
}

function formatDescription(entry: AuditLogEntry): string {
  const actionLabel = actionLabels[entry.action] ?? entry.action;
  const entityLabel = entityTypeLabels[entry.entityType] ?? entry.entityType;
  
  if (entry.entityId) {
    return `${actionLabel} – ${entityLabel} (ID: ${entry.entityId.slice(0, 8)}...)`;
  }
  return `${actionLabel} – ${entityLabel}`;
}

const PAGE_SIZE = 20;

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: AuditLogQuery = {
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      };
      if (dateFrom) query.from = dateFrom;
      if (dateTo) query.to = dateTo;
      if (actionFilter) query.action = actionFilter;
      if (entityTypeFilter) query.entityType = entityTypeFilter;

      const response = await apiListAuditLogs(query);
      setEntries(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nie udało się pobrać logów audytu.";
      setError(message);
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, actionFilter, entityTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setActionFilter("");
    setEntityTypeFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label">Administracja</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">Audit Log</p>
        </div>
        <div className="text-sm text-surface-500 dark:text-surface-400">
          Łącznie wpisów: <span className="font-semibold text-surface-900 dark:text-surface-100">{total}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Od daty
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Do daty
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Akcja
            <select
              className="input"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Wszystkie</option>
              {Object.entries(actionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Typ zasobu
            <select
              className="input"
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Wszystkie</option>
              {Object.entries(entityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn-secondary"
            onClick={handleClearFilters}
          >
            Wyczyść filtry
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Ładowanie logów audytu...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="card p-6">
          <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
            <table className="min-w-full">
              <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Data / Czas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Użytkownik
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Akcja
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Zasób
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Opis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-surface-500 dark:text-surface-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8" />
                        </svg>
                        <span>Brak wpisów dla wybranych filtrów</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-surface-900 dark:text-surface-50">
                          {new Date(entry.createdAt).toLocaleDateString("pl-PL")}
                        </div>
                        <div className="text-xs text-surface-500 dark:text-surface-400">
                          {new Date(entry.createdAt).toLocaleTimeString("pl-PL")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-semibold text-surface-600 dark:text-surface-300">
                            {formatActorName(entry.actor).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-surface-900 dark:text-surface-50">
                              {formatActorName(entry.actor)}
                            </div>
                            {entry.actor?.email && (
                              <div className="text-xs text-surface-500 dark:text-surface-400">
                                {entry.actor.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-brand">
                          {actionLabels[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-surface-700 dark:text-surface-200">
                          {entityTypeLabels[entry.entityType] ?? entry.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-surface-600 dark:text-surface-300">
                          {formatDescription(entry)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
              <div className="text-sm text-surface-500 dark:text-surface-400">
                Strona {page} z {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Poprzednia
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Następna →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
