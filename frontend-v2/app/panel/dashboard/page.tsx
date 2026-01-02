"use client";

import { useEffect, useState } from "react";
import {
  EmployeeRecord,
  PaginatedResponse,
  RequestItem,
  Shift,
  apiGetRequests,
  apiGetShifts,
  apiListEmployees,
} from "@/lib/api";

interface DashboardData {
  shifts: Shift[];
  employees: PaginatedResponse<EmployeeRecord>;
  requests: RequestItem[];
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
    Promise.all([
      apiGetShifts(range.from, range.to),
      apiListEmployees({ take: 50 }),
      apiGetRequests(),
    ])
      .then(([shifts, employees, requests]) => setData({ shifts, employees, requests }))
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać danych do dashboardu");
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

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

  const { shifts, employees, requests } = data;
  const todaysDate = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === todaysDate);
  const unassigned = shifts.filter((s) => s.status === "UNASSIGNED");
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const employeeCount = employees.total;
  const activeCount = employeeCount;

  const totalHoursWeek = shifts.reduce((sum, s) => {
    const startParts = parseTimeLabel(s.start);
    const endParts = parseTimeLabel(s.end);
    if (!startParts || !endParts) {
      return sum;
    }
    const [sh, sm] = startParts;
    const [eh, em] = endParts;
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) {
      mins += 24 * 60; // shifts crossing midnight
    }
    return sum + mins / 60;
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
            {employeeCount}
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
            {unassigned.length > 0
              ? `${unassigned.length} nieobsadzonych w tygodniu`
              : "Brak nieobsadzonych zmian"}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zmiany w tygodniu
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {shifts.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Łącznie godzin: {Math.round(totalHoursWeek)} h
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wnioski oczekujące
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {pendingRequests.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Wszystkich wniosków w tym tygodniu: {requests.length}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zespół
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {employeeCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {activeCount} aktywnych, 0 nieaktywnych
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* today shifts */}
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
                      {s.start}–{s.end} ·{" "}
                      {s.employeeName || "NIEOBSADZONA"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {s.locationName}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      s.status === "UNASSIGNED"
                        ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-800"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
                    }`}
                  >
                    {s.status === "UNASSIGNED" ? "nieobsadzona" : "obsadzona"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* requests */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Wnioski pracowników
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Do akceptacji
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs max-h-64 overflow-auto pr-1">
            {pendingRequests.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Brak oczekujących wniosków.
              </p>
            )}
            {pendingRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/90"
              >
                <div className="flex items-center justify-between">
                  <p className="text-slate-900 dark:text-slate-50">
                    {mapRequestType(r.type)} ·{" "}
                    <span className="text-slate-600 dark:text-slate-300">
                      {r.employeeName}
                    </span>
                  </p>
                  <span className="badge bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800">
                    oczekuje
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(r.date).toLocaleDateString("pl-PL")} · {r.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
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

function parseTimeLabel(value: string): [number, number] | null {
  const parts = value.split(":");
  if (parts.length !== 2) return null;
  const [h, m] = parts.map((v) => Number.parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return [h, m];
}
