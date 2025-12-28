"use client";

import { useEffect, useState } from "react";
import { Employee, apiGetEmployees } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function PracownicyPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    apiGetEmployees(token)
      .then(setEmployees)
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać listy pracowników");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Pracownicy
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Lista pracowników
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ładowanie pracowników...
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="card p-0 overflow-hidden">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                  Imię i nazwisko
                </th>
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                  Rola
                </th>
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                  Lokalizacja
                </th>
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {e.name}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {e.role}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {e.locationName}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`badge ${
                        e.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {e.active ? "aktywny" : "nieaktywny"}
                    </span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    Brak pracowników do wyświetlenia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
