"use client";

import { useEffect, useState } from "react";
import { Shift, apiGetShifts } from "@/lib/api";

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
  return dowFromDate[idx] ?? "Sun";
}

export default function GrafikPage() {
  const [range] = useState(getWeekRange);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetShifts(range.from, range.to)
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Grafik
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Tydzień: {range.label}
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Łącznie zmian w tym tygodniu:{" "}
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {shifts.length}
          </span>
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ładowanie grafiku...
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800">
                ✔ zmiana obsadzona
              </span>
              <span className="badge bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800">
                ! nieobsadzona
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Dzień
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Zmiany
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dowOrder.map((key, idx) => {
                  const dayShifts = byDay[key] || [];
                  return (
                    <tr key={key}>
                      <td className="px-3 py-2 align-top whitespace-nowrap text-slate-700 dark:text-slate-200">
                        {dowLabels[idx]}
                      </td>
                      <td className="px-3 py-2">
                        {dayShifts.length === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500">
                            Brak zmian
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {dayShifts.map((s) => (
                              <div
                                key={s.id}
                                className={`rounded-xl border px-3 py-2 shadow-sm bg-white/80 dark:bg-slate-900/90 ${
                                  s.status === "UNASSIGNED"
                                    ? "border-rose-200 text-rose-800 dark:border-rose-800 dark:text-rose-100"
                                    : "border-emerald-200 text-emerald-800 dark:border-emerald-800 dark:text-emerald-100"
                                }`}
                              >
                                <div className="font-medium">
                                  {s.start}–{s.end} ·{" "}
                                  {s.employeeName || "NIEOBSADZONA"}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-300">
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
