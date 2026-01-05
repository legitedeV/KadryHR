"use client";

import { useEffect, useState } from "react";
import {
  EmployeeRecord,
  PaginatedResponse,
  RequestItem,
  ShiftRecord,
  apiGetRequests,
  apiGetShifts,
  apiListEmployees,
} from "@/lib/api";
import { formatDateRange } from "@/lib/date-range";
import { usePermissions } from "@/lib/use-permissions";

const EMPLOYEE_FALLBACK_LABEL = "Pracownik";

interface DashboardData {
  shifts: ShiftRecord[];
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

function formatEmployeeName(shift: ShiftRecord) {
  const name = `${shift.employee?.firstName ?? ""} ${shift.employee?.lastName ?? ""}`.trim();
  if (name) return name;
  return shift.employeeId || EMPLOYEE_FALLBACK_LABEL;
}

export default function DashboardPage() {
  const { hasPermission } = usePermissions();
  const [range] = useState(getWeekRange);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canExportReports = hasPermission("REPORT_EXPORT");

  useEffect(() => {
    Promise.all([
      apiGetShifts({ from: range.from, to: range.to }),
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
  const today = new Date();
  const todaysShifts = shifts.filter((s) => isSameDay(s.startsAt, today));
  const unassigned = shifts.filter((s) => !s.employeeId);
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const employeeCount = employees.total;
  const activeCount = employeeCount;

  const totalHoursWeek = shifts.reduce((sum, s) => {
    const duration =
      (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) /
      (1000 * 60 * 60);
    return sum + Math.max(duration, 0);
  }, 0);

  const handleExport = () => {
    const rows = shifts.map((shift) => {
      const durationHours =
        (new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime()) /
        (1000 * 60 * 60);
      const employeeName = formatEmployeeName(shift);
      return [
        employeeName || EMPLOYEE_FALLBACK_LABEL,
        shift.startsAt,
        shift.endsAt,
        durationHours.toFixed(2),
      ].join(";");
    });
    const csv = ["Pracownik;Początek;Koniec;Godziny", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `raport-${range.from}-${range.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>
            Łącznie pracowników:{" "}
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {employeeCount}
            </span>
          </p>
          {canExportReports && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Eksportuj raport (CSV)
            </button>
          )}
        </div>
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
                {today.toLocaleDateString("pl-PL")}
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
                      {timeLabel(s.startsAt)}–{timeLabel(s.endsAt)} ·{" "}
                      {formatEmployeeName(s)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {s.location?.name ?? "Lokalizacja"}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      !s.employeeId
                        ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-800"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
                    }`}
                  >
                    {!s.employeeId ? "nieobsadzona" : "obsadzona"}
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
                    {formatDateRange(r.startDate, r.endDate)}
                    {r.reason ? ` · ${r.reason}` : ""}
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
    case "PAID_LEAVE":
      return "Urlop wypoczynkowy";
    case "SICK":
      return "Chorobowe";
    case "UNPAID":
      return "Urlop bezpłatny";
    case "OTHER":
      return "Inne";
    default:
      return type;
  }
}

function isSameDay(iso: string, day: Date) {
  const date = new Date(iso);
  return (
    date.getUTCFullYear() === day.getUTCFullYear() &&
    date.getUTCMonth() === day.getUTCMonth() &&
    date.getUTCDate() === day.getUTCDate()
  );
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}
