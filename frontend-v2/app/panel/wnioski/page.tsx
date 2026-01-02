"use client";

import { useEffect, useMemo, useState } from "react";
import { RequestItem, apiGetRequests } from "@/lib/api";

export default function WnioskiPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    apiGetRequests()
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Wnioski
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Lista wniosków pracowników
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ładowanie wniosków...
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* lista */}
          <div className="card p-0 lg:col-span-2 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Pracownik
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Typ
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Data
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer ${
                      selectedId === r.id
                        ? "bg-brand-50/60 dark:bg-slate-900"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                      {r.employeeName}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {mapRequestType(r.type)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {new Date(r.date).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-3 py-2">
                      <span className={statusBadgeClass(r.status)}>
                        {mapStatus(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                    >
                      Brak wniosków do wyświetlenia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* szczegóły */}
          <div className="card p-4">
            {!selected ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wybierz wniosek z listy, aby zobaczyć szczegóły.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    Szczegóły wniosku
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {mapRequestType(selected.type)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-600 dark:text-slate-300">
                    Pracownik:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {selected.employeeName}
                    </span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Data:{" "}
                    {new Date(selected.date).toLocaleDateString("pl-PL")}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Status:{" "}
                    <span className={statusBadgeClass(selected.status)}>
                      {mapStatus(selected.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    Szczegóły / powód
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-slate-200">
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
  const base =
    "badge border text-[11px] px-2.5 py-0.5 rounded-full font-medium";
  switch (status) {
    case "PENDING":
      return (
        base +
        " bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800"
      );
    case "APPROVED":
      return (
        base +
        " bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
      );
    case "REJECTED":
      return (
        base +
        " bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800"
      );
    default:
      return base;
  }
}
