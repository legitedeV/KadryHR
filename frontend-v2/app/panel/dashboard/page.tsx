"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import {
  EmployeeRecord,
  RequestItem,
  ShiftRecord,
  ApprovedLeaveForSchedule,
  apiGetRequests,
  apiGetShifts,
  apiListEmployees,
  apiGetApprovedLeavesForSchedule,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type ShiftView = {
  id: string;
  date: string;
  start: string;
  end: string;
  status: "ASSIGNED" | "UNASSIGNED";
  employeeName: string;
  employeeAvatar?: string | null;
  locationName: string;
  color?: string | null;
};

type DashboardData = {
  shifts: ShiftView[];
  employees: EmployeeRecord[];
  requests: RequestItem[];
  upcomingLeaves: ApprovedLeaveForSchedule[];
};

function parseTimeLabel(value: string): [number, number] | null {
  const parts = value.split(":");
  if (parts.length !== 2) return null;
  const [h, m] = parts.map((v) => Number.parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return [h, m];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function mapShift(record: ShiftRecord): ShiftView {
  const startDate = new Date(record.startsAt);
  const endDate = new Date(record.endsAt);
  const employeeName = record.employee
    ? `${record.employee.firstName ?? ""} ${record.employee.lastName ?? ""}`.trim() || "Pracownik"
    : "Nieprzypisana";
  const locationName = record.location?.name ?? "Brak lokalizacji";

  return {
    id: record.id,
    date: startDate.toISOString().slice(0, 10),
    start: formatTime(startDate),
    end: formatTime(endDate),
    status: record.employeeId ? "ASSIGNED" : "UNASSIGNED",
    employeeName,
    employeeAvatar: record.employee?.avatarUrl ?? null,
    locationName,
    color: record.color ?? null,
  };
}

function formatDateRange(start: string, end: string) {
  const startLabel = new Date(start).toLocaleDateString("pl-PL");
  const endLabel = new Date(end).toLocaleDateString("pl-PL");
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
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
    label: `${monday.toLocaleDateString("pl-PL")} – ${sunday.toLocaleDateString("pl-PL")}`,
  };
}

// Get next 3 days from today
function getNext3Days(): { date: string; dayName: string; dayNumber: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    result.push({
      date: date.toISOString().slice(0, 10),
      dayName: date.toLocaleDateString("pl-PL", { weekday: "short" }),
      dayNumber: date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }),
    });
  }
  return result;
}

// Get next 7 days for upcoming leaves
function getNext7DaysRange() {
  const now = new Date();
  const next7 = new Date(now);
  next7.setDate(now.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(now), to: fmt(next7) };
}

export default function DashboardPage() {
  const [range] = useState(getWeekRange);
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(
    hasSession ? null : "Zaloguj się, aby zobaczyć dashboard.",
  );

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;

    const leaveRange = getNext7DaysRange();

    Promise.all([
      apiGetShifts({ from: range.from, to: range.to }),
      apiListEmployees({ take: 50, skip: 0 }),
      apiGetRequests(),
      apiGetApprovedLeavesForSchedule({ from: leaveRange.from, to: leaveRange.to }),
    ])
      .then(([shifts, employeesResponse, requests, upcomingLeaves]) => {
        if (cancelled) return;
        setData({ shifts: shifts.map(mapShift), employees: employeesResponse.data, requests, upcomingLeaves });
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setError("Nie udało się pobrać danych do dashboardu");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, range.from, range.to]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Ładowanie danych...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        {error || "Brak danych"}
      </div>
    );
  }

  const { shifts, employees, requests, upcomingLeaves } = data;
  const todaysDate = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === todaysDate);
  const unassigned = shifts.filter((s) => s.status === "UNASSIGNED");
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const assignedEmployees = employees.filter((e) => e.locations.length > 0).length;
  
  // 3-day preview data
  const next3Days = getNext3Days();
  const shiftsByDay = next3Days.map(day => ({
    ...day,
    shifts: shifts.filter(s => s.date === day.date),
  }));

  const totalHoursWeek = shifts.reduce((sum, s) => {
    const startParts = parseTimeLabel(s.start);
    const endParts = parseTimeLabel(s.end);
    if (!startParts || !endParts) {
      console.warn("Pominięto zmianę z nieprawidłową godziną", s);
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label">Podsumowanie tygodnia</p>
          <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
            Zakres: {range.label}
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
          Łącznie pracowników: <span className="font-semibold text-surface-900 dark:text-surface-100">{employees.length}</span>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-hover p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Dzisiejsze zmiany</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{todaysShifts.length}</p>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {unassigned.length > 0 ? `${unassigned.length} nieobsadzonych w tygodniu` : "Brak nieobsadzonych zmian"}
          </p>
        </div>

        <div className="card-hover p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Zmiany w tygodniu</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{shifts.length}</p>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Łącznie godzin: {Math.round(totalHoursWeek)} h</p>
        </div>

        <div className="card-hover p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Wnioski oczekujące</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{pendingRequests.length}</p>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            Wszystkich wniosków w tym tygodniu: {requests.length}
          </p>
        </div>

        <div className="card-hover p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Zespół</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{employees.length}</p>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {assignedEmployees} z przypisaniem do lokalizacji
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* today shifts */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label">Dzisiejsza obsada</p>
              <p className="text-sm font-bold text-surface-900 dark:text-surface-50 mt-1">
                {new Date(todaysDate).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
          {todaysShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Brak zmian na dzisiaj.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysShifts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-surface-50/50 px-3 py-2 transition-all duration-200 hover:border-brand-200/50 dark:border-surface-700/80 dark:bg-surface-800/50 dark:hover:border-brand-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${s.status === "UNASSIGNED" ? "bg-rose-500" : "bg-emerald-500"}`} />
                    <div>
                      <p className="font-medium text-sm text-surface-900 dark:text-surface-50">
                        {s.start}–{s.end} · {s.employeeName || "NIEOBSADZONA"}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{s.locationName}</p>
                    </div>
                  </div>
                  <span className={`badge ${s.status === "UNASSIGNED" ? "badge-error" : "badge-success"}`}>
                    {s.status === "UNASSIGNED" ? "nieobsadzona" : "obsadzona"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* requests */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label">Wnioski pracowników</p>
              <p className="text-sm font-bold text-surface-900 dark:text-surface-50 mt-1">Do akceptacji</p>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {pendingRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="h-8 w-8 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Brak oczekujących wniosków.</p>
              </div>
            )}
            {pendingRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-surface-200/80 bg-surface-50/50 px-3 py-2 dark:border-surface-700/80 dark:bg-surface-800/50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-surface-900 dark:text-surface-50">{mapRequestType(r.type)}</p>
                  <span className="badge badge-warning">oczekuje</span>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">{r.employeeName}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {formatDateRange(r.startDate, r.endDate)} · {r.leaveType?.name ?? r.reason ?? "Brak dodatkowych danych"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Leaves Widget */}
      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 dark:from-amber-900/50 dark:to-amber-800/50 dark:text-amber-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="section-label">Urlopy</p>
            <p className="text-sm font-bold text-surface-900 dark:text-surface-50 mt-1">
              Najbliższe 7 dni
            </p>
          </div>
          <span className={`badge ${upcomingLeaves.length > 0 ? "badge-warning" : "badge-success"}`}>
            {upcomingLeaves.length} {upcomingLeaves.length === 1 ? "osoba" : "osób"}
          </span>
        </div>

        <div className="space-y-2">
          {upcomingLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <svg className="w-8 h-8 text-surface-300 dark:text-surface-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-surface-500 dark:text-surface-400 text-sm">Brak zatwierdzonych urlopów w najbliższym tygodniu</p>
            </div>
          ) : (
            upcomingLeaves.slice(0, 5).map((leave) => (
              <div key={leave.id} className="rounded-lg bg-amber-50/50 dark:bg-amber-950/30 p-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-surface-900 dark:text-surface-50">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </p>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500 text-white">
                    {leave.leaveType?.name || "Urlop"}
                  </span>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {formatDateRange(leave.startDate, leave.endDate)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3-Day Schedule Preview */}
      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 dark:from-brand-900/50 dark:to-brand-800/50 dark:text-brand-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="section-label">Podgląd grafiku</p>
            <p className="text-sm font-bold text-surface-900 dark:text-surface-50 mt-1">
              Najbliższe 3 dni
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shiftsByDay.map((day, idx) => (
            <div 
              key={day.date} 
              className={`rounded-xl border p-3 ${
                idx === 0 
                  ? 'border-brand-200 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-950/20' 
                  : 'border-surface-200/80 bg-surface-50/50 dark:border-surface-700/80 dark:bg-surface-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    idx === 0 
                      ? 'text-brand-600 dark:text-brand-400' 
                      : 'text-surface-500 dark:text-surface-400'
                  }`}>
                    {day.dayName}
                  </p>
                  <p className="text-sm font-bold text-surface-900 dark:text-surface-50">
                    {day.dayNumber}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  day.shifts.length > 0 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                    : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
                }`}>
                  {day.shifts.length} {day.shifts.length === 1 ? 'zmiana' : day.shifts.length > 1 && day.shifts.length < 5 ? 'zmiany' : 'zmian'}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {day.shifts.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-center">
                    <p className="text-xs text-surface-400 dark:text-surface-500">Brak zmian</p>
                  </div>
                ) : (
                  day.shifts.slice(0, 5).map((shift) => (
                    <div 
                      key={shift.id} 
                      className="flex items-center gap-2 rounded-lg border border-surface-200/60 bg-white px-2 py-1.5 dark:border-surface-700/60 dark:bg-surface-900/50"
                      style={shift.color ? { borderLeftColor: shift.color, borderLeftWidth: '3px' } : undefined}
                    >
                      <Avatar 
                        name={shift.employeeName} 
                        src={shift.employeeAvatar} 
                        size="sm" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-surface-900 dark:text-surface-50 truncate">
                          {shift.employeeName}
                        </p>
                        <p className="text-[10px] text-surface-500 dark:text-surface-400">
                          {shift.start}–{shift.end}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {day.shifts.length > 5 && (
                  <p className="text-xs text-center text-surface-400 dark:text-surface-500 pt-1">
                    +{day.shifts.length - 5} więcej...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center">
          <a 
            href="/panel/grafik" 
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            Przejdź do pełnego grafiku →
          </a>
        </div>
      </div>
    </div>
  );
}

function mapRequestType(type: RequestItem["type"]) {
  switch (type) {
    case "PAID_LEAVE":
      return "Urlop płatny";
    case "SICK":
      return "Chorobowe";
    case "UNPAID":
      return "Urlop bezpłatny";
    case "OTHER":
      return "Inny";
    default:
      return type;
  }
}
