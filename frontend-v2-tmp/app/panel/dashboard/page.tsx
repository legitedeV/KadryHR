"use client";

import { useEffect, useState } from "react";
import { Employee, Shift, apiGetEmployees, apiGetShifts } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface DashboardData {
  shifts: Shift[];
  employees: Employee[];
}

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

export default function DashboardPage() {
  const [range] = useState(getWeekRange);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    Promise.all([apiGetShifts(token), apiGetEmployees(token)])
      .then(([shifts, employees]) => setData({ shifts, employees }))
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać danych do dashboardu");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Ładowanie danych...
      </p>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
        {error || "Brak danych"}
      </p>
    );
  }

  const { shifts, employees } = data;
  const todaysDate = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === todaysDate);

  // tygodniowe statystyki na podstawie zakresu
  const weekShifts = shifts.filter(
    (s) => s.date >= range.from && s.date <= range.to
  );

  const totalHoursWeek = weekShifts.reduce((sum, s) => {
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return sum + Math.max(mins / 60, 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Podsumowanie tygodnia
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Zakres: {range.label}
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Łącznie pracowników:{" "}
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {employees.length}
          </span>
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dzisiejsze zmiany
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {todaysShifts.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Dla dzisiejszej daty:{" "}
            {new Date(todaysDate).toLocaleDateString("pl-PL")}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zmiany w tygodniu
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {weekShifts.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Łącznie godzin: {Math.round(totalHoursWeek)} h
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zmiany łącznie
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {shifts.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Wszystkie zapisane zmiany
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zespół
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {employees.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Łącznie utworzonych pracowników
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* today's shifts */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Dzisiejsza obsada
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {new Date(todaysDate).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>
          {todaysShifts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Brak zmian na dzisiaj.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {todaysShifts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/90"
                >
                  <div>
                    <p className="text-slate-900 dark:text-slate-50">
                      {s.start}–{s.end} · {s.employeeName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {s.locationName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* employees snippet */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Pracownicy
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Ostatnio dodani
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs max-h-64 overflow-auto pr-1">
            {employees.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Brak pracowników do wyświetlenia.
              </p>
            )}
            {employees.slice(0, 8).map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/90"
              >
                <p className="text-slate-900 dark:text-slate-50">
                  {e.fullName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {e.position || "Stanowisko nieustawione"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
