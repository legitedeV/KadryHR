"use client";

import { useEffect, useMemo, useState } from "react";
import { RequestItem, apiGetRequests } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function WnioskiPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiGetRequests(token)
      .then((items) => {
        setRequests(items);
        if (items.length > 0) setSelectedId(items[0].id);
      })
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać wniosków");
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="section-label">Wnioski</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
            Lista wniosków pracowników
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Razem: <span className="font-semibold text-surface-900 dark:text-surface-100">{requests.length}</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Ładowanie wniosków...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* lista */}
          <div className="card lg:col-span-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                  <tr className="border-b border-surface-200 dark:border-surface-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Pracownik
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Typ
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Data
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === r.id
                          ? "bg-brand-50/60 dark:bg-brand-950/30"
                          : "hover:bg-surface-50/50 dark:hover:bg-surface-800/50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 font-semibold text-xs dark:text-surface-300">
                            {r.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-surface-900 dark:text-surface-100 text-sm">
                            {r.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-surface-600 dark:text-surface-300">
                        {mapRequestType(r.type)}
                      </td>
                      <td className="px-5 py-4 text-sm text-surface-600 dark:text-surface-300">
                        {new Date(r.date).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusBadgeClass(r.status)}>
                          {mapStatus(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center">
                        <div className="flex flex-col items-center">
                          <div className="h-12 w-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            Brak wniosków do wyświetlenia.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* szczegóły */}
          <div className="card p-6">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="h-12 w-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Wybierz wniosek z listy, aby zobaczyć szczegóły.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="section-label">Szczegóły wniosku</p>
                  <p className="mt-2 text-lg font-bold text-surface-900 dark:text-surface-50">
                    {mapRequestType(selected.type)}
                  </p>
                </div>
                <div className="space-y-3 rounded-xl bg-surface-50/50 dark:bg-surface-800/50 p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Pracownik</p>
                      <p className="font-semibold text-surface-900 dark:text-surface-50">{selected.employeeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Data</p>
                      <p className="font-semibold text-surface-900 dark:text-surface-50">{new Date(selected.date).toLocaleDateString("pl-PL")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Status</p>
                      <span className={statusBadgeClass(selected.status)}>
                        {mapStatus(selected.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="section-label">Szczegóły / powód</p>
                  <p className="mt-2 text-sm text-surface-700 dark:text-surface-200 leading-relaxed">
                    {selected.details}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function mapRequestType(type: RequestItem["type"]) {
  switch (type) {
    case "VACATION":
      return "Urlop";
    case "SICK":
      return "Chorobowe";
    case "SHIFT_GIVE":
      return "Oddanie zmiany";
    case "SHIFT_SWAP":
      return "Zamiana zmiany";
    default:
      return type;
  }
}

function mapStatus(status: RequestItem["status"]) {
  switch (status) {
    case "PENDING":
      return "oczekuje";
    case "APPROVED":
      return "zaakceptowany";
    case "REJECTED":
      return "odrzucony";
    default:
      return status;
  }
}

function statusBadgeClass(status: RequestItem["status"]) {
  switch (status) {
    case "PENDING":
      return "badge badge-warning";
    case "APPROVED":
      return "badge badge-success";
    case "REJECTED":
      return "badge badge-error";
    default:
      return "badge badge-neutral";
  }
}
