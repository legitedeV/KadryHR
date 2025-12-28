"use client";

import { useEffect, useState } from "react";
import { apiGetShifts, Shift } from "@/lib/api";
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

export default function GrafikPage() {
  const [{ from, to, label }] = useState(getWeekRange);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    apiGetShifts(token, from, to)
      .then(setShifts)
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać grafiku (sprawdź endpointy w lib/api.ts)");
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  const dayNames = [
    "Poniedziałek",
    "Wtorek",
    "Środa",
    "Czwartek",
    "Piątek",
    "Sobota",
    "Niedziela",
  ];
  const dowKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

  const mapDow = (dateStr: string) => {
    const d = new Date(dateStr);
    const idx = d.getDay(); // 0-6, 0 = Sun
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx];
  };

  const grouped: Record<string, Shift[]> = {};
  dowKeys.forEach((k) => (grouped[k] = []));
  shifts.forEach((s) => {
    const key = mapDow(s.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500">Grafik</p>
          <p className="text-sm font-semibold text-slate-100">
            Tydzień: {label}
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Łącznie zmian:{" "}
          <span className="text-slate-100">{shifts.length}</span>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-300">Ładowanie grafiku…</p>
      )}

      {error && (
        <p className="text-sm text-rose-300 bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-3 py-2 text-left text-slate-400">Dzień</th>
                <th className="px-3 py-2 text-left text-slate-400">Zmiany</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950">
              {dayNames.map((name, idx) => {
                const key = dowKeys[idx];
                const list = grouped[key] || [];
                return (
                  <tr key={key}>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-200">
                      {name}
                    </td>
                    <td className="px-3 py-2">
                      {list.length === 0 ? (
                        <span className="text-slate-500">Brak zmian</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {list.map((s) => (
                            <div
                              key={s.id}
                              className={`rounded-lg px-2 py-1 border text-[11px] ${
                                s.status === "UNASSIGNED"
                                  ? "border-rose-500 bg-rose-950/40 text-rose-100"
                                  : "border-emerald-600 bg-emerald-900/40 text-emerald-50"
                              }`}
                            >
                              <div className="font-medium">
                                {s.start}–{s.end} ·{" "}
                                {s.employeeName || "NIEOBSADZONA"}
                              </div>
                              <div className="text-[10px] text-slate-200">
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
      )}
    </div>
  );
}
