"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import {
  EmployeeRecord,
  ShiftRecord,
  apiGetShifts,
  apiListEmployees,
  apiListLocations,
  LocationRecord,
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
  locations: LocationRecord[];
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

function getShiftTone(shift: ShiftView): { className: string; style?: CSSProperties } {
  if (shift.color) {
    return {
      className: "border text-surface-100",
      style: {
        backgroundColor: `${shift.color}22`,
        borderColor: `${shift.color}55`,
      },
    };
  }
  const timeParts = parseTimeLabel(shift.start);
  const hour = timeParts ? timeParts[0] : 8;
  if (hour < 12) return { className: "bg-amber-500/10 border-amber-400/30 text-amber-100" };
  if (hour < 17) return { className: "bg-brand-500/10 border-brand-400/30 text-brand-100" };
  return { className: "bg-accent-500/10 border-accent-400/30 text-accent-100" };
}

function getWeekDays(range: { from: string }) {
  const days: { label: string; date: string }[] = [];
  const start = new Date(range.from);
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push({
      label: day.toLocaleDateString("pl-PL", { weekday: "short" }),
      date: day.toISOString().slice(0, 10),
    });
  }
  return days;
}

function buildChartSeries(shifts: ShiftView[], range: { from: string }) {
  const days = getWeekDays(range);
  const totals = days.map((day) => {
    const dayHours = shifts
      .filter((s) => s.date === day.date)
      .reduce((sum, s) => {
        const startParts = parseTimeLabel(s.start);
        const endParts = parseTimeLabel(s.end);
        if (!startParts || !endParts) return sum;
        const [sh, sm] = startParts;
        const [eh, em] = endParts;
        let mins = eh * 60 + em - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        return sum + mins / 60;
      }, 0);
    return { ...day, value: Number(dayHours.toFixed(1)) };
  });
  const maxValue = Math.max(1, ...totals.map((t) => t.value));
  return { totals, maxValue };
}

export default function DashboardPage() {
  const [range] = useState(getWeekRange);
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(
    hasSession ? null : "Zaloguj się, aby zobaczyć dashboard.",
  );
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;

    Promise.all([
      apiGetShifts({ from: range.from, to: range.to }),
      apiListEmployees({ take: 50, skip: 0 }),
      apiListLocations(),
    ])
      .then(([shifts, employeesResponse, locations]) => {
        if (cancelled) return;
        setData({ shifts: shifts.map(mapShift), employees: employeesResponse.data, locations });
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

  const { shifts, employees, locations } = data;
  const todaysDate = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === todaysDate);
  const assignedEmployees = employees.filter((e) => e.locations.length > 0);
  const pendingEmployees = employees.filter((e) => e.locations.length === 0);
  const employeeWithEmail = employees.find((employee) => Boolean(employee.email));

  const onboardingSteps = [
    {
      id: "organisation",
      title: "Załóż organizację",
      description: "Twoja organizacja jest już aktywna po rejestracji.",
      status: "done" as const,
      actionLabel: "Zobacz profil organizacji",
      href: "/panel/profil",
    },
    {
      id: "employee",
      title: "Dodaj pierwszego pracownika",
      description: "Zbuduj bazę zespołu i przypisz role w organizacji.",
      status: employees.length > 0 ? ("done" as const) : ("todo" as const),
      actionLabel: employees.length > 0 ? "Przejrzyj zespół" : "Skontaktuj się z wdrożeniem",
      href: employees.length > 0 ? "/panel/grafik" : "mailto:kontakt@kadryhr.pl?subject=Dodanie%20pracownika",
    },
    {
      id: "location",
      title: "Dodaj pierwszą lokalizację",
      description: "Lokalizacje porządkują grafiki i raporty w wielu oddziałach.",
      status: locations.length > 0 ? ("done" as const) : ("todo" as const),
      actionLabel: locations.length > 0 ? "Zobacz grafik lokalizacji" : "Skontaktuj się z wdrożeniem",
      href: locations.length > 0 ? "/panel/grafik" : "mailto:kontakt@kadryhr.pl?subject=Dodanie%20lokalizacji",
    },
    {
      id: "first-shift",
      title: "Zaplanuj pierwszą zmianę",
      description: "Utwórz pierwszy blok pracy w grafiku.",
      status: shifts.length > 0 ? ("done" as const) : ("todo" as const),
      actionLabel: "Otwórz grafik",
      href: "/panel/grafik",
    },
    {
      id: "publish",
      title: "Opublikuj pierwszy grafik",
      description: "Opublikuj plan, aby pracownicy widzieli swoje zmiany.",
      status: shifts.length > 0 ? ("in-progress" as const) : ("todo" as const),
      actionLabel: "Publikuj grafik",
      href: "/panel/grafik-v2",
    },
    {
      id: "invite",
      title: "Zaproś pracownika do systemu",
      description: "Wyślij zaproszenie, aby pracownik potwierdził konto.",
      status: employeeWithEmail ? ("in-progress" as const) : ("todo" as const),
      actionLabel: employeeWithEmail ? "Wyślij zaproszenie" : "Skontaktuj się z wdrożeniem",
      href: employeeWithEmail
        ? `mailto:${employeeWithEmail.email}?subject=Zaproszenie%20do%20KadryHR`
        : "mailto:kontakt@kadryhr.pl?subject=Zaproszenie%20pracownika",
    },
  ];
  const completedSteps = onboardingSteps.filter((step) => step.status === "done").length;

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

  const { totals: chartTotals, maxValue } = buildChartSeries(shifts, range);
  const todaysHours = chartTotals.find((day) => day.date === todaysDate)?.value ?? 0;
  const employeeTabs = [
    { key: "all", label: "Wszyscy", data: employees },
    { key: "active", label: "Aktywni", data: assignedEmployees },
    { key: "pending", label: "Pending", data: pendingEmployees },
  ];
  const activeEmployees = employeeTabs.find((tab) => tab.key === activeTab)?.data ?? employees;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-surface-50">Dashboard</p>
          <p className="text-sm text-surface-400">Tydzień pracy: {range.label}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-surface-300">
          <span className="panel-pill">
            Łącznie pracowników: <strong className="text-surface-100">{employees.length}</strong>
          </span>
          <span className="panel-pill">
            Plan godzin: <strong className="text-surface-100">{Math.round(totalHoursWeek)} h</strong>
          </span>
        </div>
      </div>

      <div className="panel-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Onboarding</p>
            <p className="text-base font-semibold text-surface-50 mt-1">Zaczynajmy! {completedSteps}/6 kroków</p>
            <p className="text-sm text-surface-400 mt-1">
              Prowadzimy Cię przez konfigurację – każdy krok aktualizuje się automatycznie po wykonaniu.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-surface-300">
              <span>Postęp</span>
              <span>{completedSteps}/6</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-surface-800/80">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${Math.min(100, (completedSteps / 6) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {onboardingSteps.map((step) => {
            const statusLabel =
              step.status === "done" ? "Ukończony" : step.status === "in-progress" ? "W trakcie" : "Do zrobienia";
            const statusTone =
              step.status === "done"
                ? "bg-emerald-500/15 text-emerald-200"
                : step.status === "in-progress"
                ? "bg-amber-500/15 text-amber-200"
                : "bg-surface-800/70 text-surface-300";
            return (
              <div key={step.id} className="flex items-start justify-between gap-4 rounded-2xl border border-surface-800/70 bg-surface-900/60 px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone}`}>
                      {statusLabel}
                    </span>
                    <p className="text-sm font-semibold text-surface-100">{step.title}</p>
                  </div>
                  <p className="text-xs text-surface-400">{step.description}</p>
                </div>
                <a
                  href={step.href}
                  className="whitespace-nowrap rounded-full border border-surface-700/80 px-3 py-1 text-xs font-semibold text-surface-200 transition hover:border-brand-400/60 hover:text-brand-200"
                >
                  {step.actionLabel}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="panel-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Today&apos;s schedule</p>
                <p className="text-base font-semibold text-surface-50">
                  {new Date(todaysDate).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                {todaysShifts.length} zm.
              </span>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {todaysShifts.length === 0 ? (
                <div className="w-full rounded-2xl border border-dashed border-surface-800/70 bg-surface-900/40 px-6 py-8 text-center text-sm text-surface-400">
                  Brak zmian zaplanowanych na dzisiaj.
                </div>
              ) : (
                todaysShifts.map((shift) => {
                  const tone = getShiftTone(shift);
                  return (
                    <div
                      key={shift.id}
                      className={`min-w-[220px] rounded-2xl border px-4 py-3 shadow-sm ${tone.className}`}
                      style={tone.style}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.02em] text-surface-300">
                        {shift.start}–{shift.end}
                      </p>
                      <p className="text-sm font-semibold text-surface-100 mt-1">
                        {shift.employeeName}
                      </p>
                      <p className="text-xs text-surface-300">{shift.locationName}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Employees & Roles</p>
                <p className="text-base font-semibold text-surface-50">
                  Zespół w organizacji
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {employeeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      activeTab === tab.key
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-surface-900/70 text-surface-300 hover:bg-surface-900/90"
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label} ({tab.data.length})
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {activeEmployees.length === 0 ? (
                <div className="w-full rounded-2xl border border-dashed border-surface-800/70 bg-surface-900/40 px-6 py-8 text-center text-sm text-surface-400">
                  Brak pracowników w tym widoku.
                </div>
              ) : (
                activeEmployees.map((employee) => (
                  <div key={employee.id} className="min-w-[240px] rounded-2xl border border-surface-800/70 bg-surface-900/70 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-50 truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-surface-400 truncate">{employee.email ?? "Brak emaila"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-surface-800/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-surface-300">
                        {employee.position ?? "Pracownik"}
                      </span>
                      <div className="flex items-center gap-2 text-surface-400">
                        {employee.phone && (
                          <a
                            href={`tel:${employee.phone}`}
                            className="rounded-full border border-surface-800/70 p-1.5 text-xs hover:text-brand-300"
                            aria-label="Zadzwoń"
                          >
                            📞
                          </a>
                        )}
                        {employee.email && (
                          <a
                            href={`mailto:${employee.email}`}
                            className="rounded-full border border-surface-800/70 p-1.5 text-xs hover:text-brand-300"
                            aria-label="Wyślij email"
                          >
                            ✉️
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Work time statistics</p>
                <p className="text-base font-semibold text-surface-50">Plan godzin</p>
              </div>
              <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-200">
                Dziś: {todaysHours} h
              </span>
            </div>
            <div className="mt-4">
              <svg viewBox="0 0 300 120" className="w-full h-28">
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1ea574" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1ea574" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="#1ea574"
                  strokeWidth="3"
                  points={chartTotals
                    .map((point, idx) => {
                      const x = (idx / (chartTotals.length - 1)) * 280 + 10;
                      const y = 100 - (point.value / maxValue) * 70;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
                <polygon
                  fill="url(#hoursGradient)"
                  points={`10,100 ${chartTotals
                    .map((point, idx) => {
                      const x = (idx / (chartTotals.length - 1)) * 280 + 10;
                      const y = 100 - (point.value / maxValue) * 70;
                      return `${x},${y}`;
                    })
                    .join(" ")} 290,100`}
                />
              </svg>
              <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-surface-400">
                {chartTotals.map((day) => (
                  <span key={day.date}>{day.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Analytics</p>
            <p className="text-base font-semibold text-surface-50 mt-1">Szybkie statystyki</p>
            <div className="mt-4 space-y-4">
              {[
                { label: "Zaplanowani dzisiaj", value: todaysShifts.length, max: employees.length || 1 },
                { label: "Aktywni w grafiku", value: assignedEmployees.length, max: employees.length || 1 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-surface-300">
                    <span>{item.label}</span>
                    <strong className="text-surface-100">{item.value}</strong>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-surface-800/80">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Potrzebujesz pomocy?</p>
            <p className="text-base font-semibold text-surface-50 mt-1">Jesteśmy dostępni w 3 kanałach</p>
            <p className="text-sm text-surface-400 mt-2">
              Wybierz najszybszą formę kontaktu – odpowiadamy w ciągu 24h.
            </p>
            <div className="mt-4 grid gap-2">
              <a
                href="mailto:kontakt@kadryhr.pl?subject=Komunikator%20KadryHR"
                className="rounded-2xl border border-surface-800/70 bg-surface-900/70 px-4 py-3 text-sm font-semibold text-surface-100 transition hover:border-brand-400/60 hover:text-brand-200"
              >
                Komunikator
                <span className="block text-xs font-normal text-surface-400">Napisz do zespołu wdrożeń</span>
              </a>
              <a
                href="https://kadryhr.pl/konsultacja"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-surface-800/70 bg-surface-900/70 px-4 py-3 text-sm font-semibold text-surface-100 transition hover:border-brand-400/60 hover:text-brand-200"
              >
                Konsultacja online
                <span className="block text-xs font-normal text-surface-400">Umów demo z doradcą</span>
              </a>
              <a
                href="tel:+48221234567"
                className="rounded-2xl border border-surface-800/70 bg-surface-900/70 px-4 py-3 text-sm font-semibold text-surface-100 transition hover:border-brand-400/60 hover:text-brand-200"
              >
                Telefon
                <span className="block text-xs font-normal text-surface-400">+48 22 123 45 67</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
