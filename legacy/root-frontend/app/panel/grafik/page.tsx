"use client";

import { useEffect, useState } from "react";
import { Shift, apiGetShifts } from "@/lib/api";
import { getToken } from "@/lib/auth";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: fmt(monday),
    to: fmt(sunday),
    label: `${monday.toLocaleDateString("pl-PL")} – ${sunday.toLocaleDateString(
      "pl-PL"
    )}`,
  };
}

const dowOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const dowLabels = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

const dowFromDate = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getDowKey(date: string) {
  const d = new Date(date);
  const idx = d.getDay(); // 0 = Sun
  if (Number.isNaN(idx) || idx < 0 || idx > 6) return "Sun";
  return dowFromDate[idx] ?? "Sun";
}

export default function GrafikPage() {
  const [range] = useState(getWeekRange);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiGetShifts(token, range.from, range.to)
      .then(setShifts)
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać grafiku z backendu");
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const byDay: Record<string, Shift[]> = {};
  dowOrder.forEach((k) => (byDay[k] = []));
  shifts.forEach((s) => {
    const key = getDowKey(s.date);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label">Grafik</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
            Tydzień: {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Łącznie zmian w tym tygodniu: <span className="font-semibold text-surface-900 dark:text-surface-100">{shifts.length}</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Ładowanie grafiku...
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
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge badge-success flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                zmiana obsadzona
              </span>
              <span className="badge badge-error flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                nieobsadzona
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
            <table className="min-w-full">
              <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-36">
                    Dzień
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Zmiany
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {dowOrder.map((key, idx) => {
                  const dayShifts = byDay[key] || [];
                  return (
                    <tr key={key} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-semibold text-surface-600 dark:text-surface-300">
                            {dowLabels[idx].slice(0, 2)}
                          </div>
                          <span className="font-medium text-surface-700 dark:text-surface-200">
                            {dowLabels[idx]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {dayShifts.length === 0 ? (
                          <span className="text-sm text-surface-400 dark:text-surface-500">
                            Brak zmian
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {dayShifts.map((s) => (
                              <div
                                key={s.id}
                                className={`rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft ${
                                  s.status === "UNASSIGNED"
                                    ? "border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/30"
                                    : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/30"
                                }`}
                              >
                                <div className={`font-semibold text-sm ${
                                  s.status === "UNASSIGNED"
                                    ? "text-rose-800 dark:text-rose-200"
                                    : "text-emerald-800 dark:text-emerald-200"
                                }`}>
                                  {s.start}–{s.end}
                                </div>
                                <div className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">
                                  {s.employeeName || "NIEOBSADZONA"}
                                </div>
                                <div className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                                  {s.locationName}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
