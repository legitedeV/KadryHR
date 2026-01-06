"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployeeRecord, apiListEmployees } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function formatEmployeeName(employee: EmployeeRecord) {
  const fullName = `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
  return fullName || employee.email || "Pracownik";
}

function formatLocations(locations: EmployeeRecord["locations"]) {
  if (!locations || locations.length === 0) return "Brak przypisania";
  return locations.map((loc) => loc.name).filter(Boolean).join(", ");
}

export default function PracownicyPage() {
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(
    hasSession ? null : "Zaloguj się, aby wyświetlić listę pracowników.",
  );

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;

    apiListEmployees({ take: 50, skip: 0 })
      .then((response) => {
        if (cancelled) return;
        setEmployees(response.data);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setError("Nie udało się pobrać listy pracowników");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="section-label">Pracownicy</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
            Lista pracowników
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Razem: <span className="font-semibold text-surface-900 dark:text-surface-100">{employees.length}</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Ładowanie pracowników...
        </div>
      )}

      {error && (
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

      {!loading && !error && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Imię i nazwisko
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Stanowisko
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Lokalizacja
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-700 font-semibold text-sm dark:from-brand-900/50 dark:to-accent-900/50 dark:text-brand-300">
                          {formatEmployeeName(employee).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          {formatEmployeeName(employee)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-surface-600 dark:text-surface-300">
                      {employee.position ?? "Brak danych"}
                    </td>
                    <td className="px-5 py-4 text-sm text-surface-600 dark:text-surface-300">
                      {formatLocations(employee.locations)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="badge badge-success">aktywny</span>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">Brak pracowników do wyświetlenia.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
