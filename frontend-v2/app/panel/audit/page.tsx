"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useCallback } from "react";
import {
  apiListAuditLogs,
  apiGetOrganisationMembers,
  AuditLogEntry,
  AuditLogQuery,
  OrganisationMember,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";

const actionLabels: Record<string, string> = {
  CREATE: "Utworzenie",
  UPDATE: "Aktualizacja",
  DELETE: "Usunięcie",
  LOGIN: "Logowanie",
  LOGOUT: "Wylogowanie",
  PUBLISH: "Publikacja",
  APPROVE: "Zatwierdzenie",
  REJECT: "Odrzucenie",
  EMPLOYEE_CREATE: "Dodanie pracownika",
  EMPLOYEE_UPDATE: "Edycja pracownika",
  EMPLOYEE_DELETE: "Usunięcie pracownika",
  SHIFT_CREATE: "Dodanie zmiany",
  SHIFT_UPDATE: "Edycja zmiany",
  SHIFT_DELETE: "Usunięcie zmiany",
  SCHEDULE_PUBLISH: "Publikacja grafiku",
  SCHEDULE_CLEAR_WEEK: "Czyszczenie tygodnia",
  "leave.create": "Złożenie wniosku",
  "leave.update": "Edycja wniosku",
  "leave.status_change": "Zmiana statusu wniosku",
};

const entityTypeLabels: Record<string, string> = {
  shift: "Zmiana",
  employee: "Pracownik",
  "leave-request": "Wniosek urlopowy",
  LeaveRequest: "Wniosek urlopowy",
  schedule: "Grafik",
  location: "Lokalizacja",
  notification: "Powiadomienie",
  user: "Użytkownik",
  "user-profile": "Profil użytkownika",
  "user-password": "Hasło użytkownika",
  "user-email": "Email użytkownika",
  "user-role": "Rola użytkownika",
  organisation: "Organizacja",
};

function formatActorName(actor?: AuditLogEntry["actor"]): string {
  if (!actor) return "System";
  const name = `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim();
  return name || actor.email;
}

function formatDescription(entry: AuditLogEntry): string {
  const actionLabel = actionLabels[entry.action] ?? entry.action;
  const entityLabel = entityTypeLabels[entry.entityType] ?? entry.entityType;

  if (entry.entityId && entry.entityId.trim()) {
    return `${actionLabel} – ${entityLabel} (ID: ${entry.entityId.slice(0, 8)}...)`;
  }
  return `${actionLabel} – ${entityLabel}`;
}

function formatJsonValue(value: unknown, depth = 0): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-surface-400">null</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-amber-600 dark:text-amber-400">{value ? "true" : "false"}</span>;
  }

  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  }

  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) {
      return (
        <span className="text-emerald-600 dark:text-emerald-400">
          &quot;{value.slice(0, MAX_STRING_LENGTH)}...&quot;
        </span>
      );
    }
    return <span className="text-emerald-600 dark:text-emerald-400">&quot;{value}&quot;</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-surface-400">[]</span>;
    return (
      <div className="ml-4">
        {value.map((item, idx) => (
          <div key={idx} className="flex">
            <span className="text-surface-400 mr-2">{idx}:</span>
            {formatJsonValue(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-surface-400">{"{}"}</span>;
    return (
      <div className={depth > 0 ? "ml-4" : ""}>
        {entries.map(([key, val]) => (
          <div key={key} className="flex flex-wrap">
            <span className="text-violet-600 dark:text-violet-400 font-medium mr-2">{key}:</span>
            {formatJsonValue(val, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}

const PAGE_SIZE = 20;
const MAX_STRING_LENGTH = 100;

// Table columns: Date, User, Action, Resource, Description, Details
const TABLE_COLUMNS = ["Date", "User", "Action", "Resource", "Description", "Details"] as const;

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  // Detail modal
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  // Load members once on mount
  useEffect(() => {
    apiGetOrganisationMembers()
      .then((membersData) => {
        setMembers(membersData);
      })
      .catch((err) => {
        console.error("Failed to load members:", err);
      });
  }, []);

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
      if (userFilter) query.actorUserId = userFilter;

      const logsResponse = await apiListAuditLogs(query);
      setEntries(logsResponse.data);
      setTotal(logsResponse.total);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nie udało się pobrać logów audytu.";
      setError(message);
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, actionFilter, entityTypeFilter, userFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setActionFilter("");
    setEntityTypeFilter("");
    setUserFilter("");
    setPage(1);
  };

  const formatMemberName = (member: OrganisationMember) => {
    const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
    return name || member.email;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label">Administracja</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
            Audit Log
          </p>
        </div>
        <div className="text-sm text-surface-500 dark:text-surface-400">
          Łącznie wpisów:{" "}
          <span className="font-semibold text-surface-900 dark:text-surface-100">{total}</span>
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
            Użytkownik
            <select
              className="input"
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Wszyscy</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {formatMemberName(member)}
                </option>
              ))}
            </select>
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
          <button className="btn-secondary" onClick={handleClearFilters}>
            Wyczyść filtry
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          role="status"
          aria-label="Ładowanie logów audytu"
          className="flex items-center gap-3 text-surface-600 dark:text-surface-300"
        >
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Ładowanie logów audytu...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
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
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Szczegóły
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length}
                      className="px-4 py-8 text-center"
                    >
                      <EmptyState
                        icon={
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8"
                            />
                          </svg>
                        }
                        title="Brak wpisów"
                        description="Brak wpisów audytu dla wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania."
                      />
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors"
                    >
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
                      <td className="px-4 py-3 text-right">
                        <button
                          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          Zobacz
                        </button>
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

      {/* Detail Modal */}
      <Modal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Szczegóły wpisu audytu"
        description={selectedEntry ? formatDescription(selectedEntry) : ""}
        footer={
          <button className="btn-secondary" onClick={() => setSelectedEntry(null)}>
            Zamknij
          </button>
        }
      >
        {selectedEntry && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-surface-500 dark:text-surface-400">Data:</span>
                <div className="font-medium text-surface-900 dark:text-surface-50">
                  {new Date(selectedEntry.createdAt).toLocaleString("pl-PL")}
                </div>
              </div>
              <div>
                <span className="text-surface-500 dark:text-surface-400">Użytkownik:</span>
                <div className="font-medium text-surface-900 dark:text-surface-50">
                  {formatActorName(selectedEntry.actor)}
                </div>
              </div>
              <div>
                <span className="text-surface-500 dark:text-surface-400">Akcja:</span>
                <div className="font-medium text-surface-900 dark:text-surface-50">
                  {actionLabels[selectedEntry.action] ?? selectedEntry.action}
                </div>
              </div>
              <div>
                <span className="text-surface-500 dark:text-surface-400">Typ zasobu:</span>
                <div className="font-medium text-surface-900 dark:text-surface-50">
                  {entityTypeLabels[selectedEntry.entityType] ?? selectedEntry.entityType}
                </div>
              </div>
              {selectedEntry.entityId && (
                <div className="col-span-2">
                  <span className="text-surface-500 dark:text-surface-400">ID zasobu:</span>
                  <div className="font-mono text-xs text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                    {selectedEntry.entityId}
                  </div>
                </div>
              )}
              {selectedEntry.ip && (
                <div>
                  <span className="text-surface-500 dark:text-surface-400">Adres IP:</span>
                  <div className="font-mono text-xs text-surface-700 dark:text-surface-200">
                    {selectedEntry.ip}
                  </div>
                </div>
              )}
            </div>

            {/* Before State */}
            {selectedEntry.before && Object.keys(selectedEntry.before).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  Stan przed zmianą:
                </h4>
                <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3 text-sm font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {formatJsonValue(selectedEntry.before)}
                </div>
              </div>
            )}

            {/* After State */}
            {selectedEntry.after && Object.keys(selectedEntry.after).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  Stan po zmianie:
                </h4>
                <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3 text-sm font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {formatJsonValue(selectedEntry.after)}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
