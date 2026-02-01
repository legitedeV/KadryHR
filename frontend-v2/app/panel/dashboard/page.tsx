"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { CardSquare } from "@/components/panel/CardSquare";
import { KpiTile } from "@/components/panel/KpiTile";
import { LoadingSkeleton } from "@/components/panel/LoadingSkeleton";
import {
  EmployeeRecord,
  ShiftRecord,
  apiGetShifts,
  apiListEmployees,
  apiListLocations,
  LocationRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";

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
      className: "border text-surface-900",
      style: {
        backgroundColor: `${shift.color}22`,
        borderColor: `${shift.color}55`,
      },
    };
  }
  const timeParts = parseTimeLabel(shift.start);
  const hour = timeParts ? timeParts[0] : 8;
  if (hour < 12) return { className: "bg-amber-500/10 border-amber-400/30 text-amber-900" };
  if (hour < 17) return { className: "bg-brand-500/10 border-brand-400/30 text-brand-900" };
  return { className: "bg-accent-500/10 border-accent-400/30 text-accent-900" };
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

function getShiftStatusLabel(shift: ShiftView, now: Date) {
  if (shift.status === "UNASSIGNED") {
    return { label: "Nieobsadzona", tone: "bg-rose-500/10 text-rose-700" };
  }
  const today = now.toISOString().slice(0, 10);
  if (shift.date !== today) {
    return { label: "Zaplanowana", tone: "bg-surface-100 text-surface-700" };
  }
  const timeParts = parseTimeLabel(shift.start);
  const endParts = parseTimeLabel(shift.end);
  if (!timeParts || !endParts) {
    return { label: "Zaplanowana", tone: "bg-surface-100 text-surface-700" };
  }
  const [startHour, startMinute] = timeParts;
  const [endHour, endMinute] = endParts;
  const start = new Date(now);
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(now);
  end.setHours(endHour, endMinute, 0, 0);
  if (now >= end) return { label: "Zakończona", tone: "bg-orange-100 text-orange-800" };
  if (now >= start) return { label: "W trakcie", tone: "bg-amber-500/10 text-amber-700" };
  return { label: "Zaplanowana", tone: "bg-surface-100 text-surface-700" };
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
  const { startMainPanelTour, hasBeenCompleted, hasBeenSkipped, isReady } = useOnboarding();

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

  useEffect(() => {
    if (!hasSession || loading || !isReady) return;
    if (hasBeenCompleted || hasBeenSkipped) return;
    const timer = window.setTimeout(() => {
      startMainPanelTour();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [hasBeenCompleted, hasBeenSkipped, hasSession, isReady, loading, startMainPanelTour]);

  if (loading) {
    return (
      <CardSquare title="Dashboard" description="Ładowanie danych do panelu.">
        <LoadingSkeleton lines={5} />
      </CardSquare>
    );
  }

  if (error || !data) {
    return (
      <CardSquare title="Brak danych" description={error || "Nie udało się pobrać danych do dashboardu."}>
        <div className="text-sm text-surface-600">
          Sprawdź połączenie lub spróbuj ponownie za chwilę.
        </div>
      </CardSquare>
    );
  }

  const { shifts, employees, locations } = data;
  const todaysDate = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === todaysDate);
  const assignedEmployees = employees.filter((e) => e.locations.length > 0);
  const pendingEmployees = employees.filter((e) => e.locations.length === 0);
  const employeeWithEmail = employees.find((employee) => Boolean(employee.email));
  const now = new Date();

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
      actionLabel: employees.length > 0 ? "Przejrzyj zespół" : "Dodaj pracownika",
      href: employees.length > 0 ? "/panel/grafik" : "/panel/profil",
    },
    {
      id: "device",
      title: "Dodaj metodę rejestracji czasu",
      description: "Skonfiguruj Web, kiosk lub QR do rejestracji czasu pracy.",
      status: "todo" as const,
      actionLabel: "Funkcja w przygotowaniu",
      href: "#",
    },
    {
      id: "attendance",
      title: "Zarejestruj pierwszą obecność",
      description: "Zaloguj pierwsze wejście/wyjście w RCP.",
      status: "todo" as const,
      actionLabel: "Funkcja w przygotowaniu",
      href: "#",
    },
    {
      id: "first-shift",
      title: "Opublikuj pierwszy grafik",
      description: "Udostępnij plan pracy zespołowi.",
      status: shifts.length > 0 ? ("done" as const) : ("todo" as const),
      actionLabel: "Publikuj grafik",
      href: "/panel/grafik",
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
  const workedHoursToday = 0;
  const differenceToday = Number((workedHoursToday - todaysHours).toFixed(1));
  const employeeTabs = [
    { key: "all", label: "Wszyscy", data: employees },
    { key: "active", label: "Aktywni", data: assignedEmployees },
    { key: "pending", label: "Oczekujący", data: pendingEmployees },
  ];
  const activeEmployees = employeeTabs.find((tab) => tab.key === activeTab)?.data ?? employees;
  const chartPoints = chartTotals.map((point, idx) => {
    const x = (idx / Math.max(1, chartTotals.length - 1)) * 260 + 20;
    const y = 100 - (point.value / maxValue) * 60;
    return { ...point, x, y };
  });
  const chartPath = chartPoints
    .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${chartPath} L 280 100 L 20 100 Z`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-surface-900">Dashboard</p>
          <p className="text-sm text-surface-600">Tydzień pracy: {range.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiTile label="Pracownicy" value={`${employees.length}`} helper="Łącznie w organizacji" />
        <KpiTile label="Lokalizacje" value={`${locations.length}`} helper="Aktywne lokalizacje" />
        <KpiTile label="Plan godzin" value={`${Math.round(totalHoursWeek)} h`} helper="Tydzień pracy" />
      </div>

      <CardSquare
        title="Wdrożenie"
        description="Lista kroków do pełnego uruchomienia panelu."
        actionSlot={<span className="text-xs font-semibold text-surface-600">Postęp: {completedSteps}/6</span>}
      >
        <div className="border border-surface-300 rounded-md divide-y divide-surface-200">
          {onboardingSteps.map((step) => {
            const statusLabel =
              step.status === "done" ? "Ukończony" : step.status === "in-progress" ? "W trakcie" : "Do zrobienia";
            const statusTone =
              step.status === "done"
                ? "bg-orange-100 text-orange-800"
                : step.status === "in-progress"
                ? "bg-amber-500/10 text-amber-700"
                : "bg-surface-100 text-surface-700";
            return (
              <div key={step.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={step.status === "done"}
                    readOnly
                    className="h-4 w-4 rounded-sm border border-surface-300 text-brand-600"
                  />
                  <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md ${statusTone}`}>
                    {statusLabel}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{step.title}</p>
                  <p className="text-xs text-surface-600">{step.description}</p>
                </div>
                <a
                  href={step.href}
                  className="justify-self-start sm:justify-self-end rounded-md border border-surface-300 bg-surface-50 px-3 py-1 text-xs font-semibold text-surface-700 transition hover:border-brand-400/50 hover:text-brand-800"
                >
                  {step.actionLabel}
                </a>
              </div>
            );
          })}
        </div>
      </CardSquare>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <CardSquare
            title="Dzisiejsze zmiany"
            description={new Date(todaysDate).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
            actionSlot={<span className="text-xs font-semibold text-surface-600">{todaysShifts.length} zm.</span>}
          >
            {todaysShifts.length === 0 ? (
              <EmptyState title="Brak zmian zaplanowanych na dzisiaj." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {todaysShifts.map((shift) => {
                  const tone = getShiftTone(shift);
                  const status = getShiftStatusLabel(shift, now);
                  return (
                    <div
                      key={shift.id}
                      className={`border rounded-md px-4 py-3 ${tone.className}`}
                      style={tone.style}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.02em] text-surface-600">
                          {shift.start}–{shift.end}
                        </p>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${status.tone}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-surface-900 mt-1">
                        {shift.employeeName}
                      </p>
                      <p className="text-xs text-surface-600">{shift.locationName}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardSquare>

          <CardSquare
            title="Zespół i role"
            description="Zespół w organizacji"
            actionSlot={
              <div className="flex flex-wrap gap-2">
                {employeeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                      activeTab === tab.key
                        ? "border-brand-300 bg-brand-100 text-brand-900"
                        : "border-surface-300 bg-surface-50 text-surface-700 hover:border-brand-200"
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label} ({tab.data.length})
                  </button>
                ))}
              </div>
            }
          >
            {activeEmployees.length === 0 ? (
              <EmptyState title="Brak pracowników w tym widoku." />
            ) : (
              <div className="border border-surface-300 rounded-md divide-y divide-surface-200">
                {activeEmployees.map((employee) => (
                  <div key={employee.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-surface-600 truncate">{employee.email ?? "Brak emaila"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                      <span className="px-2 py-1 rounded-md bg-surface-100 text-surface-700">
                        {employee.position ?? "Pracownik"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md ${
                          employee.locations.length > 0
                        ? "bg-orange-100 text-orange-800"
                        : "bg-amber-500/10 text-amber-700"
                    }`}
                      >
                        {employee.locations.length > 0 ? "Aktywny" : "Oczekujący"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-surface-500">
                      {employee.phone && (
                        <a
                          href={`tel:${employee.phone}`}
                          className="rounded-md border border-surface-300 px-2 py-1 text-xs hover:text-brand-700"
                          aria-label="Zadzwoń"
                        >
                          📞
                        </a>
                      )}
                      {employee.email && (
                        <a
                          href={`mailto:${employee.email}`}
                          className="rounded-md border border-surface-300 px-2 py-1 text-xs hover:text-brand-700"
                          aria-label="Wyślij email"
                        >
                          ✉️
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardSquare>
        </div>

        <div className="space-y-6">
          <CardSquare
            title="Statystyki czasu pracy"
            description="Plan godzin"
            actionSlot={<span className="text-xs font-semibold text-surface-600">Dziś: {todaysHours} h</span>}
          >
            <div className="grid gap-3 text-sm text-surface-700">
              <div className="flex items-center justify-between">
                <span>Zaplanowane godziny</span>
                <strong className="text-surface-900">{todaysHours} h</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Przepracowane (RCP)</span>
                <strong className="text-surface-900">{workedHoursToday} h</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Różnica</span>
                <strong className={differenceToday >= 0 ? "text-orange-700" : "text-rose-700"}>
                  {differenceToday} h
                </strong>
              </div>
              <p className="text-xs text-surface-500">
                Dane RCP będą widoczne po uruchomieniu modułu rejestracji czasu pracy.
              </p>
            </div>
            <div className="mt-4 h-44 border border-surface-300 rounded-md bg-surface-50 p-3">
              <svg viewBox="0 0 300 120" className="w-full h-full">
                <defs>
                  <linearGradient id="hoursArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <line x1="20" y1="20" x2="20" y2="100" stroke="#e6ded2" strokeWidth="1" />
                <line x1="20" y1="100" x2="280" y2="100" stroke="#e6ded2" strokeWidth="1" />
                <path d={areaPath} fill="url(#hoursArea)" />
                <path d={chartPath} className="chart-line" stroke="#F97316" strokeWidth="2" fill="none" />
                {chartPoints.map((point) => (
                  <circle key={point.date} cx={point.x} cy={point.y} r="2" fill="#F97316" />
                ))}
                {chartPoints.map((point) => (
                  <text
                    key={`${point.date}-label`}
                    x={point.x}
                    y={112}
                    fontSize="8"
                    textAnchor="middle"
                    fill="#6e655d"
                  >
                    {point.label}
                  </text>
                ))}
              </svg>
            </div>
          </CardSquare>

          <CardSquare title="Analityka" description="Szybkie statystyki">
            <div className="space-y-4">
              {[
                { label: "Zaplanowani dzisiaj", value: todaysShifts.length, max: employees.length || 1 },
                { label: "Aktywni w grafiku", value: assignedEmployees.length, max: employees.length || 1 },
                { label: "Nieobecności w tym tygodniu", value: 0, max: employees.length || 1 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-surface-700">
                    <span>{item.label}</span>
                    <strong className="text-surface-900">{item.value}</strong>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-md bg-surface-100">
                    <div
                      className="h-2 rounded-md bg-brand-500"
                      style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardSquare>

          <CardSquare title="Alerty" description="Stan systemu">
            <div className="border border-surface-300 rounded-md divide-y divide-surface-200 text-sm text-surface-700">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-surface-900">Wnioski urlopowe</p>
                  <p className="text-xs text-surface-500">Brak danych do wyświetlenia.</p>
                </div>
                <span className="px-3 py-1 rounded-md bg-surface-100 text-xs font-semibold text-surface-700">0</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-surface-900">Konflikty w grafiku</p>
                  <p className="text-xs text-surface-500">Moduł w przygotowaniu.</p>
                </div>
                <span className="px-3 py-1 rounded-md bg-surface-100 text-xs font-semibold text-surface-700">—</span>
              </div>
            </div>
          </CardSquare>

          <CardSquare title="Potrzebujesz pomocy?" description="Jesteśmy dostępni w 3 kanałach">
            <p className="text-sm text-surface-600">
              Wybierz najszybszą formę kontaktu – odpowiadamy w ciągu 24h.
            </p>
            <div className="mt-3 grid gap-2">
              <a
                href="mailto:kontakt@kadryhr.pl?subject=Komunikator%20KadryHR"
                className="rounded-md border border-surface-300 bg-surface-50 px-4 py-3 text-sm font-semibold text-surface-900 transition hover:bg-surface-100"
              >
                Komunikator
                <span className="block text-xs font-normal text-surface-600">Napisz do zespołu wdrożeń</span>
              </a>
              <a
                href="https://kadryhr.pl/konsultacja"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-surface-300 bg-surface-50 px-4 py-3 text-sm font-semibold text-surface-900 transition hover:bg-surface-100"
              >
                Konsultacja online
                <span className="block text-xs font-normal text-surface-600">Umów demo z doradcą</span>
              </a>
              <a
                href="tel:+48221234567"
                className="rounded-md border border-surface-300 bg-surface-50 px-4 py-3 text-sm font-semibold text-surface-900 transition hover:bg-surface-100"
              >
                Telefon
                <span className="block text-xs font-normal text-surface-600">+48 22 123 45 67</span>
              </a>
            </div>
            <button
              type="button"
              onClick={() => startMainPanelTour()}
              className="mt-3 w-full rounded-md border border-brand-500/40 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-500/20"
            >
              Uruchom przewodnik po panelu
            </button>
          </CardSquare>
        </div>
      </div>
    </div>
  );
}
