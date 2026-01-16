"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import {
  apiGetMe,
  apiGetActiveAvailabilityWindows,
  apiGetAvailabilityWindows,
  apiGetTeamAvailability,
  apiGetTeamAvailabilityStats,
  apiGetEmployeeAvailability,
  apiUpdateEmployeeAvailability,
  apiGetMyWindowAvailability,
  apiSaveMyWindowAvailability,
  apiGetWindowTeamAvailability,
  apiGetWindowTeamAvailabilityStats,
  apiGetWindowEmployeeAvailability,
  apiUpdateWindowEmployeeAvailability,
  apiUpdateWindowSubmissionStatus,
  apiListLocations,
  apiCreateAvailabilityWindow,
  apiCloseAvailabilityWindow,
  AvailabilityWindowRecord,
  AvailabilityRecord,
  AvailabilityInput,
  AvailabilityWindowSubmissionResponse,
  AvailabilitySubmissionStatus,
  AvailabilityWindowTeamStats,
  User,
  Weekday,
  EmployeeAvailabilitySummary,
  TeamAvailabilityStatsResponse,
  EmployeeAvailabilityDetailResponse,
  LocationRecord,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";

const WEEKDAYS: { key: Weekday; label: string; shortLabel: string }[] = [
  { key: "MONDAY", label: "Poniedziałek", shortLabel: "Pon" },
  { key: "TUESDAY", label: "Wtorek", shortLabel: "Wt" },
  { key: "WEDNESDAY", label: "Środa", shortLabel: "Śr" },
  { key: "THURSDAY", label: "Czwartek", shortLabel: "Cz" },
  { key: "FRIDAY", label: "Piątek", shortLabel: "Pt" },
  { key: "SATURDAY", label: "Sobota", shortLabel: "So" },
  { key: "SUNDAY", label: "Niedziela", shortLabel: "Nd" },
];

const AVAILABILITY_TEMPLATES: Array<{ key: string; label: string; start: string; end: string }> = [
  { key: "morning", label: "Rano", start: "05:45", end: "15:00" },
  { key: "afternoon", label: "Popołudnie", start: "14:15", end: "23:15" },
  { key: "delivery", label: "Dostawa", start: "06:00", end: "12:00" },
];

interface DayAvailability {
  weekday: Weekday;
  slots: Array<{ start: string; end: string }>;
  status?: "AVAILABLE" | "DAY_OFF";
}

type ActiveTab = "my" | "team";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

function getWindowStatus(window: AvailabilityWindowRecord) {
  const now = new Date();
  const deadline = new Date(window.deadline);
  if (window.isOpen && !window.closedAt && deadline >= now) {
    return { key: "active", label: "Aktywne", badge: "badge-success" };
  }
  if (window.closedAt || deadline < now) {
    return { key: "closed", label: "Zakończone", badge: "badge-secondary" };
  }
  return { key: "upcoming", label: "Nadchodzące", badge: "badge-warning" };
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function buildCalendarWeeks(startDate: Date, endDate: Date) {
  const weeks: Array<Array<Date | null>> = [];
  let cursor = startOfWeek(startDate);
  const lastDate = new Date(endDate);
  lastDate.setHours(23, 59, 59, 999);

  while (cursor <= lastDate) {
    const week: Array<Date | null> = [];
    for (let i = 0; i < 7; i += 1) {
      const current = addDays(cursor, i);
      if (current < startDate || current > endDate) {
        week.push(null);
      } else {
        week.push(new Date(current));
      }
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isAdmin(role: string): boolean {
  return role === "OWNER" || role === "MANAGER" || role === "ADMIN";
}

// Loading skeleton for availability card
function AvailabilitySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-surface-200/80 dark:border-surface-700/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-24 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-4 w-20 bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
          <div className="h-10 w-full bg-surface-100 dark:bg-surface-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Team table skeleton
function TeamTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-surface-100 dark:bg-surface-800 rounded-t-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 border-b border-surface-200/80 dark:border-surface-700/80 flex items-center px-4 gap-4">
          <div className="h-10 w-10 bg-surface-200 dark:bg-surface-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded mb-2" />
            <div className="h-3 w-24 bg-surface-100 dark:bg-surface-800 rounded" />
          </div>
          <div className="h-6 w-16 bg-surface-200 dark:bg-surface-700 rounded" />
        </div>
      ))}
    </div>
  );
}

// Availability Window Status Card
function WindowStatusCard({
  window,
  isAdmin: adminView,
  onOpenWindow,
}: {
  window: AvailabilityWindowRecord | null;
  isAdmin: boolean;
  onOpenWindow?: () => void;
}) {
  if (window) {
    return (
      <div className="card p-5 border-l-4 border-l-emerald-500">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-success">Otwarte</span>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                {window.title}
              </h3>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Okres: {formatDateShort(window.startDate)} – {formatDateShort(window.endDate)}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Termin: {formatDate(window.deadline)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 border-l-4 border-l-surface-300 dark:border-l-surface-600">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 dark:text-surface-500 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-surface-700 dark:text-surface-300">
            Składanie dyspozycji zamknięte
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Aktualnie nie ma otwartego okna na składanie dyspozycji. Poczekaj na informację od pracodawcy.
          </p>
          {adminView && onOpenWindow && (
            <button
              onClick={onOpenWindow}
              className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              + Otwórz okno składania dyspozycji
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AvailabilityWindowsList({
  windows,
  loading,
  onRequestClose,
}: {
  windows: AvailabilityWindowRecord[];
  loading: boolean;
  onRequestClose: (windowId: string) => void;
}) {
  if (loading) {
    return (
      <div className="card p-5 text-sm text-surface-500 dark:text-surface-400">
        Ładowanie okien dyspozycji...
      </div>
    );
  }

  if (windows.length === 0) {
    return (
      <EmptyState
        title="Brak okien dyspozycji"
        description="Utwórz nowe okno, aby pracownicy mogli przesyłać dyspozycje."
      />
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200/80 dark:border-surface-700/80">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
          Okna dyspozycji
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Zarządzaj terminami składania dyspozycji w organizacji.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/60 text-surface-500 dark:text-surface-400">
            <tr>
              <th className="text-left font-semibold px-5 py-3">Nazwa okna / opis</th>
              <th className="text-left font-semibold px-5 py-3">Okres od–do</th>
              <th className="text-left font-semibold px-5 py-3">Status</th>
              <th className="text-right font-semibold px-5 py-3">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {windows.map((window) => {
              const status = getWindowStatus(window);
              return (
                <tr
                  key={window.id}
                  className="border-t border-surface-200/80 dark:border-surface-700/80"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-surface-900 dark:text-surface-100">
                      {window.title}
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                      Termin składania: {formatDate(window.deadline)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-surface-700 dark:text-surface-300">
                    {formatDate(window.startDate)} – {formatDate(window.endDate)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${status.badge}`}>{status.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {status.key === "active" ? (
                      <button
                        onClick={() => onRequestClose(window.id)}
                        className="btn-secondary text-sm"
                      >
                        Zamknij okno dyspozycji
                      </button>
                    ) : (
                      <span className="text-xs text-surface-400 dark:text-surface-500">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getSubmissionStatusLabel(status: AvailabilitySubmissionStatus) {
  switch (status) {
    case "SUBMITTED":
      return { label: "Wysłano", tone: "badge-success" };
    case "REVIEWED":
      return { label: "Zweryfikowano", tone: "badge-info" };
    case "REOPENED":
      return { label: "Wymaga poprawek", tone: "badge-warning" };
    default:
      return { label: "Wersja robocza", tone: "badge-secondary" };
  }
}

// Monthly Availability Tab Component
function MonthlyAvailabilityTab({
  window,
  submission,
  saving,
  onSave,
}: {
  window: AvailabilityWindowRecord;
  submission: AvailabilityWindowSubmissionResponse | null;
  saving: boolean;
  onSave: (availabilities: AvailabilityInput[], submit: boolean) => Promise<void>;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const initialData = useMemo(() => {
    const map: Record<string, Array<{ start: string; end: string }>> = {};
    const dayOffs: Record<string, boolean> = {};
    (submission?.availability ?? []).forEach((entry) => {
      if (!entry.date) return;
      const key = toDateKey(new Date(entry.date));
      if (entry.status === "DAY_OFF") {
        dayOffs[key] = true;
        return;
      }
      if (!map[key]) map[key] = [];
      map[key].push({
        start: formatMinutes(entry.startMinutes),
        end: formatMinutes(entry.endMinutes),
      });
    });
    return { map, dayOffs };
  }, [submission]);

  const [calendarData, setCalendarData] = useState(initialData.map);
  const [dayOffs, setDayOffs] = useState(initialData.dayOffs);

  useEffect(() => {
    setCalendarData(initialData.map);
    setDayOffs(initialData.dayOffs);
  }, [initialData]);

  const status = submission?.status ?? "DRAFT";
  const statusMeta = getSubmissionStatusLabel(status);
  const isLocked = status === "SUBMITTED" || status === "REVIEWED";

  const startDate = useMemo(() => new Date(window.startDate), [window.startDate]);
  const endDate = useMemo(() => new Date(window.endDate), [window.endDate]);
  const weeks = useMemo(() => buildCalendarWeeks(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (!selectedDate && weeks[0]?.[0]) {
      setSelectedDate(toDateKey(weeks[0][0] as Date));
    }
  }, [selectedDate, weeks]);

  const slotsForSelected = selectedDate ? calendarData[selectedDate] ?? [] : [];
  const isSelectedDayOff = selectedDate ? !!dayOffs[selectedDate] : false;

  const updateSlot = (slotIndex: number, field: "start" | "end", value: string) => {
    if (!selectedDate) return;
    if (dayOffs[selectedDate]) return;
    setCalendarData((prev) => {
      const slots = [...(prev[selectedDate] ?? [])];
      slots[slotIndex] = { ...slots[slotIndex], [field]: value };
      return { ...prev, [selectedDate]: slots };
    });
  };

  const addSlot = () => {
    if (!selectedDate) return;
    setDayOffs((prev) => {
      if (!prev[selectedDate]) return prev;
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setCalendarData((prev) => {
      const slots = [...(prev[selectedDate] ?? [])];
      slots.push({ start: "08:00", end: "16:00" });
      return { ...prev, [selectedDate]: slots };
    });
  };

  const addTemplateSlot = (templateKey: string) => {
    if (!selectedDate) return;
    const template = AVAILABILITY_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;
    setDayOffs((prev) => {
      if (!prev[selectedDate]) return prev;
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setCalendarData((prev) => {
      const slots = [...(prev[selectedDate] ?? [])];
      slots.push({ start: template.start, end: template.end });
      return { ...prev, [selectedDate]: slots };
    });
  };

  const removeSlot = (slotIndex: number) => {
    if (!selectedDate) return;
    setCalendarData((prev) => {
      const slots = (prev[selectedDate] ?? []).filter((_, idx) => idx !== slotIndex);
      return { ...prev, [selectedDate]: slots };
    });
  };

  const toggleDayOff = () => {
    if (!selectedDate) return;
    setDayOffs((prev) => {
      const next = { ...prev };
      if (next[selectedDate]) {
        delete next[selectedDate];
      } else {
        next[selectedDate] = true;
      }
      return next;
    });
    setCalendarData((prev) => ({ ...prev, [selectedDate]: [] }));
  };

  const handleSave = async (submit: boolean) => {
    const availabilities: AvailabilityInput[] = [];
    for (const [date, slots] of Object.entries(calendarData)) {
      for (const slot of slots) {
        const startMinutes = parseTime(slot.start);
        const endMinutes = parseTime(slot.end);
        if (startMinutes >= endMinutes) {
          pushToast({
            title: "Błąd",
            description: "Godzina początkowa musi być przed godziną końcową.",
            variant: "error",
          });
          return;
        }
        availabilities.push({
          date,
          startMinutes,
          endMinutes,
        });
      }
    }
    Object.keys(dayOffs).forEach((date) => {
      availabilities.push({
        date,
        startMinutes: 0,
        endMinutes: 0,
        status: "DAY_OFF",
      });
    });

    await onSave(availabilities, submit);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="card p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="section-label">Miesięczna dyspozycja</p>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {window.title} · {formatMonthLabel(startDate)}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Zakres: {formatDateShort(window.startDate)} – {formatDateShort(window.endDate)} · Termin do{" "}
              {formatDate(window.deadline)}
            </p>
          </div>
          <span className={`badge ${statusMeta.tone}`}>{statusMeta.label}</span>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-7 text-xs text-surface-500 dark:text-surface-400">
            {WEEKDAYS.map((day) => (
              <span key={day.key} className="text-center py-1">
                {day.shortLabel}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="h-20 rounded-xl bg-surface-50 dark:bg-surface-900/30" />;
                  }
                  const key = toDateKey(day);
                  const slots = calendarData[key] ?? [];
                  const isDayOff = !!dayOffs[key];
                  const isSelected = selectedDate === key;
                  return (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      className={`h-20 rounded-xl border text-left px-2 py-2 transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-50/60 dark:bg-brand-900/20"
                          : "border-surface-200/80 dark:border-surface-700/80 hover:border-brand-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {day.getDate()}
                        </span>
                        {isDayOff && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400">
                            Dzień wolny
                          </span>
                        )}
                        {!isDayOff && slots.length > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {slots.length} slot
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                        {isDayOff
                          ? "Dzień wolny"
                          : slots.length === 0
                            ? "Dostępny (domyślnie)"
                            : slots.map((slot) => `${slot.start}-${slot.end}`).join(", ")}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <div>
          <p className="section-label">Wybrany dzień</p>
          <h4 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            {selectedDate ? formatDate(selectedDate) : "Wybierz dzień z kalendarza"}
          </h4>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {isSelectedDayOff
              ? "Ten dzień jest oznaczony jako wolny."
              : "Dodaj dostępne godziny lub zostaw domyślną dostępność."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`badge ${isSelectedDayOff ? "badge-error" : "badge-success"}`}>
              {isSelectedDayOff ? "Dzień wolny" : "Dostępny"}
            </span>
            {!isLocked && selectedDate && (
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={toggleDayOff}
              >
                {isSelectedDayOff ? "Usuń dzień wolny" : "Oznacz dzień wolny"}
              </button>
            )}
          </div>
        </div>

        {slotsForSelected.length === 0 ? (
          <div className="space-y-4">
            {isSelectedDayOff ? (
              <EmptyState
                title="Dzień wolny"
                description="Ten dzień jest oznaczony jako wolny i nie będzie dostępności."
              />
            ) : (
              <EmptyState
                title="Dostępny (domyślnie)"
                description="Dodaj przedziały czasowe, jeśli chcesz zawęzić dostępność."
              />
            )}
            {!isLocked && !isSelectedDayOff && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_TEMPLATES.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => addTemplateSlot(template.key)}
                    >
                      {template.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    onClick={toggleDayOff}
                  >
                    Dzień wolny
                  </button>
                </div>
                <button type="button" className="btn-secondary w-full" onClick={addSlot}>
                  Inne godziny
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {slotsForSelected.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="time"
                  className="input py-1 px-2 text-sm w-24"
                  value={slot.start}
                  onChange={(e) => updateSlot(idx, "start", e.target.value)}
                  disabled={isLocked}
                />
                <span className="text-surface-400">–</span>
                <input
                  type="time"
                  className="input py-1 px-2 text-sm w-24"
                  value={slot.end}
                  onChange={(e) => updateSlot(idx, "end", e.target.value)}
                  disabled={isLocked}
                />
                {!isLocked && (
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-600 p-1"
                    onClick={() => removeSlot(idx)}
                  >
                    Usuń
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLocked && slotsForSelected.length > 0 && !isSelectedDayOff && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => addTemplateSlot(template.key)}
                >
                  {template.label}
                </button>
              ))}
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={toggleDayOff}
              >
                Dzień wolny
              </button>
            </div>
            <button type="button" className="btn-secondary w-full" onClick={addSlot}>
              Inne godziny
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleSave(true)}
            disabled={saving || isLocked}
          >
            {saving ? "Wysyłanie..." : "Wyślij dyspozycję"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleSave(false)}
            disabled={saving || isLocked}
          >
            {saving ? "Zapisywanie..." : "Zapisz wersję roboczą"}
          </button>
          {isLocked && (
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Dyspozycja została wysłana. Skontaktuj się z managerem, aby ją odblokować.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Team Availability Tab Component
function TeamAvailabilityTab({
  stats,
  employees,
  locations,
  filters,
  setFilters,
  loading,
  onEmployeeClick,
}: {
  stats: TeamAvailabilityStatsResponse | null;
  employees: EmployeeAvailabilitySummary[];
  locations: LocationRecord[];
  filters: { search: string; locationId: string; role: string };
  setFilters: React.Dispatch<React.SetStateAction<{ search: string; locationId: string; role: string }>>;
  loading: boolean;
  onEmployeeClick: (employeeId: string) => void;
}) {
  if (loading) {
    return <TeamTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {stats.totalEmployees}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Pracowników</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.employeesWithAvailability}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Z dyspozycją</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.employeesWithoutAvailability}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Bez dyspozycji</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Szukaj pracownika..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>
          <select
            className="input w-full sm:w-48"
            value={filters.locationId}
            onChange={(e) => setFilters((f) => ({ ...f, locationId: e.target.value }))}
          >
            <option value="">Wszystkie lokalizacje</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select
            className="input w-full sm:w-40"
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="">Wszystkie role</option>
            <option value="OWNER">Właściciel</option>
            <option value="MANAGER">Menedżer</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Pracownik</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card overflow-hidden">
        {employees.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Brak pracowników"
            description="Nie znaleziono pracowników pasujących do kryteriów"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200/80 dark:border-surface-700/80">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Pracownik
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Stanowisko
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Lokalizacje
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Status
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/80 dark:divide-surface-700/80">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer"
                    onClick={() => onEmployeeClick(emp.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/50 dark:to-brand-800/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-surface-50">
                            {emp.firstName} {emp.lastName}
                          </p>
                          {emp.email && (
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                              {emp.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-surface-600 dark:text-surface-300">
                      {emp.position || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {emp.locations.slice(0, 2).map((loc) => (
                          <span key={loc.id} className="badge badge-neutral text-xs">
                            {loc.name}
                          </span>
                        ))}
                        {emp.locations.length > 2 && (
                          <span className="badge badge-neutral text-xs">
                            +{emp.locations.length - 2}
                          </span>
                        )}
                        {emp.locations.length === 0 && (
                          <span className="text-sm text-surface-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {emp.availabilityCount === 0 ? (
                        <span className="badge badge-success">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Dostępny (domyślnie)
                        </span>
                      ) : emp.hasWeeklyDefault ? (
                        <span className="badge badge-success">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Podana
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                          </svg>
                          Wymaga uzupełnienia
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmployeeClick(emp.id);
                        }}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function WindowTeamAvailabilityTab({
  loading,
  window,
  stats,
  employees,
  onSelectEmployee,
  onUpdateStatus,
}: {
  loading: boolean;
  window: AvailabilityWindowRecord;
  stats: AvailabilityWindowTeamStats | null;
  employees: EmployeeAvailabilitySummary[];
  onSelectEmployee: (employeeId: string) => void;
  onUpdateStatus: (employeeId: string, status: AvailabilitySubmissionStatus) => void;
}) {
  if (loading) {
    return <TeamTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="section-label">Status dyspozycji</p>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {window.title}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-surface-400">Wysłane</p>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                {stats?.submittedCount ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-surface-400">Zweryfikowane</p>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                {stats?.reviewedCount ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-surface-400">Brak</p>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                {stats?.pendingCount ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        {employees.length === 0 ? (
          <EmptyState
            title="Brak pracowników"
            description="Dodaj pracowników, aby zobaczyć ich dyspozycje."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-surface-400 uppercase border-b border-surface-200/80 dark:border-surface-700/80">
                  <th className="text-left py-2">Pracownik</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Wysłano</th>
                  <th className="text-right py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const status = employee.submissionStatus ?? "DRAFT";
                  const meta = getSubmissionStatusLabel(status);
                  return (
                    <tr key={employee.id} className="border-b border-surface-100/60 dark:border-surface-800/60">
                      <td className="py-3">
                        <p className="font-medium text-surface-900 dark:text-surface-50">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {employee.position || employee.email || "-"}
                        </p>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${meta.tone}`}>{meta.label}</span>
                      </td>
                      <td className="py-3 text-surface-500">
                        {employee.submittedAt ? formatDateShort(employee.submittedAt) : "—"}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          type="button"
                          className="text-brand-600 hover:text-brand-700 text-xs font-medium"
                          onClick={() => onSelectEmployee(employee.id)}
                        >
                          Podgląd
                        </button>
                        {status === "SUBMITTED" && (
                          <button
                            type="button"
                            className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                            onClick={() => onUpdateStatus(employee.id, "REVIEWED")}
                          >
                            Zweryfikuj
                          </button>
                        )}
                        {(status === "SUBMITTED" || status === "REVIEWED") && (
                          <button
                            type="button"
                            className="text-amber-600 hover:text-amber-700 text-xs font-medium"
                            onClick={() => onUpdateStatus(employee.id, "REOPENED")}
                          >
                            Otwórz ponownie
                          </button>
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
    </div>
  );
}

// Employee Detail Side Panel
function EmployeeDetailPanel({
  open,
  employee,
  availability,
  loading,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: EmployeeAvailabilityDetailResponse["employee"] | null;
  availability: AvailabilityRecord[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (availabilities: AvailabilityInput[]) => Promise<void>;
}) {
  // Compute initial form data from availability
  const initialFormData = useMemo(() => {
    if (availability.length > 0) {
      return WEEKDAYS.map((w) => {
        const dayAvail = availability.filter((a) => a.weekday === w.key);
        const isDayOff = dayAvail.some((a) => a.status === "DAY_OFF");
        return {
          weekday: w.key,
          status: isDayOff ? "DAY_OFF" : "AVAILABLE",
          slots: dayAvail
            .filter((a) => a.status !== "DAY_OFF")
            .map((a) => ({
              start: formatMinutes(a.startMinutes),
              end: formatMinutes(a.endMinutes),
            })),
        };
      });
    }
    return WEEKDAYS.map((w) => ({ weekday: w.key, slots: [], status: "AVAILABLE" }));
  }, [availability]);

  const [formData, setFormData] = useState<DayAvailability[]>(initialFormData);

  // Reset form when availability changes (using a key to track changes)
  const availabilityKey = useMemo(() => 
    availability.map(a => `${a.id}-${a.weekday}-${a.startMinutes}-${a.endMinutes}-${a.status ?? ""}`).join(','),
    [availability]
  );
  
  useEffect(() => {
    setFormData(initialFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey]);

  const handleSave = async () => {
    // Validate slots
    for (const day of formData) {
      for (const slot of day.slots) {
        const startMins = parseTime(slot.start);
        const endMins = parseTime(slot.end);
        if (startMins >= endMins) {
          pushToast({
            title: "Błąd",
            description: `Godzina początkowa musi być przed godziną końcową (${WEEKDAYS.find((w) => w.key === day.weekday)?.label})`,
            variant: "error",
          });
          return;
        }
      }
    }

    const availabilities: AvailabilityInput[] = formData.flatMap((day) => {
      if (day.status === "DAY_OFF") {
        return [
          {
            weekday: day.weekday,
            startMinutes: 0,
            endMinutes: 0,
            status: "DAY_OFF",
          },
        ];
      }
      return day.slots.map((slot) => ({
        weekday: day.weekday,
        startMinutes: parseTime(slot.start),
        endMinutes: parseTime(slot.end),
      }));
    });

    await onSave(availabilities);
  };

  const addSlot = (weekday: Weekday) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        return {
          ...day,
          status: "AVAILABLE",
          slots: [...day.slots, { start: "08:00", end: "16:00" }],
        };
      })
    );
  };

  const updateSlot = (weekday: Weekday, slotIndex: number, field: "start" | "end", value: string) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        if (day.status === "DAY_OFF") return day;
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...day, slots: newSlots };
      })
    );
  };

  const removeSlot = (weekday: Weekday, slotIndex: number) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        return { ...day, slots: day.slots.filter((_, i) => i !== slotIndex) };
      })
    );
  };

  const toggleDayOff = (weekday: Weekday) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        const nextStatus = day.status === "DAY_OFF" ? "AVAILABLE" : "DAY_OFF";
        return {
          ...day,
          status: nextStatus,
          slots: nextStatus === "DAY_OFF" ? [] : day.slots,
        };
      }),
    );
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      title={employee ? `${employee.firstName} ${employee.lastName}` : "Ładowanie..."}
      description={employee?.position || employee?.email || undefined}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </>
      }
    >
      {loading ? (
        <AvailabilitySkeleton />
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {WEEKDAYS.map(({ key, label }) => {
            const dayData = formData.find((d) => d.weekday === key);
            const slots = dayData?.slots || [];
            const isDayOff = dayData?.status === "DAY_OFF";

            return (
              <div key={key} className="rounded-lg border border-surface-200/80 dark:border-surface-700/80 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-surface-900 dark:text-surface-50">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${isDayOff ? "badge-error" : "badge-success"}`}>
                      {isDayOff ? "Dzień wolny" : "Dostępny"}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                      onClick={() => toggleDayOff(key)}
                    >
                      {isDayOff ? "Usuń wolne" : "Dzień wolny"}
                    </button>
                    {!isDayOff && (
                      <button
                        type="button"
                        className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                        onClick={() => addSlot(key)}
                      >
                        + Dodaj
                      </button>
                    )}
                  </div>
                </div>
                {slots.length === 0 ? (
                  <p className="text-xs text-surface-400 py-2">
                    {isDayOff ? "Dzień wolny" : "Dostępny (domyślnie)"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          className="input py-1 px-2 text-sm w-24"
                          value={slot.start}
                          onChange={(e) => updateSlot(key, idx, "start", e.target.value)}
                        />
                        <span className="text-surface-400">–</span>
                        <input
                          type="time"
                          className="input py-1 px-2 text-sm w-24"
                          value={slot.end}
                          onChange={(e) => updateSlot(key, idx, "end", e.target.value)}
                        />
                        <button
                          type="button"
                          className="text-rose-500 hover:text-rose-600 p-1"
                          onClick={() => removeSlot(key, idx)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function WindowEmployeeDetailPanel({
  open,
  employee,
  availability,
  window,
  status,
  loading,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: EmployeeAvailabilityDetailResponse["employee"] | null;
  availability: AvailabilityRecord[];
  window: AvailabilityWindowRecord | null;
  status: AvailabilitySubmissionStatus | null;
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (availabilities: AvailabilityInput[]) => Promise<void>;
}) {
  const initialData = useMemo(() => {
    const map: Record<string, Array<{ start: string; end: string }>> = {};
    const dayOffs: Record<string, boolean> = {};
    availability.forEach((entry) => {
      if (!entry.date) return;
      const key = entry.date.split("T")[0];
      if (entry.status === "DAY_OFF") {
        dayOffs[key] = true;
        return;
      }
      if (!map[key]) map[key] = [];
      map[key].push({
        start: formatMinutes(entry.startMinutes),
        end: formatMinutes(entry.endMinutes),
      });
    });
    return { map, dayOffs };
  }, [availability]);

  const [calendarData, setCalendarData] = useState(initialData.map);
  const [dayOffs, setDayOffs] = useState(initialData.dayOffs);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setCalendarData(initialData.map);
    setDayOffs(initialData.dayOffs);
  }, [initialData]);

  const windowStart = window ? new Date(window.startDate) : null;
  const windowEnd = window ? new Date(window.endDate) : null;
  const weeks = useMemo(() => {
    if (!windowStart || !windowEnd) return [];
    return buildCalendarWeeks(windowStart, windowEnd);
  }, [windowStart, windowEnd]);

  useEffect(() => {
    if (!selectedDate && weeks[0]?.[0]) {
      setSelectedDate(toDateKey(weeks[0][0] as Date));
    }
  }, [selectedDate, weeks]);

  const slotsForSelected = selectedDate ? calendarData[selectedDate] ?? [] : [];
  const isSelectedDayOff = selectedDate ? !!dayOffs[selectedDate] : false;

  const updateSlot = (slotIndex: number, field: "start" | "end", value: string) => {
    if (!selectedDate) return;
    if (dayOffs[selectedDate]) return;
    setCalendarData((prev) => {
      const slots = [...(prev[selectedDate] ?? [])];
      slots[slotIndex] = { ...slots[slotIndex], [field]: value };
      return { ...prev, [selectedDate]: slots };
    });
  };

  const addSlot = () => {
    if (!selectedDate) return;
    setDayOffs((prev) => {
      if (!prev[selectedDate]) return prev;
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setCalendarData((prev) => {
      const slots = [...(prev[selectedDate] ?? [])];
      slots.push({ start: "08:00", end: "16:00" });
      return { ...prev, [selectedDate]: slots };
    });
  };

  const addTemplateSlot = (templateKey: string) => {
    if (!selectedDate) return;
    const template = AVAILABILITY_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;
    setDayOffs((prev) => {
      if (!prev[selectedDate]) return prev;
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setCalendarData((prev) => {
      const slots = [...(prev[selectedDate] ?? [])];
      slots.push({ start: template.start, end: template.end });
      return { ...prev, [selectedDate]: slots };
    });
  };

  const removeSlot = (slotIndex: number) => {
    if (!selectedDate) return;
    setCalendarData((prev) => {
      const slots = (prev[selectedDate] ?? []).filter((_, idx) => idx !== slotIndex);
      return { ...prev, [selectedDate]: slots };
    });
  };

  const toggleDayOff = () => {
    if (!selectedDate) return;
    setDayOffs((prev) => {
      const next = { ...prev };
      if (next[selectedDate]) {
        delete next[selectedDate];
      } else {
        next[selectedDate] = true;
      }
      return next;
    });
    setCalendarData((prev) => ({ ...prev, [selectedDate]: [] }));
  };

  const handleSave = async () => {
    const availabilities: AvailabilityInput[] = [];
    for (const [date, slots] of Object.entries(calendarData)) {
      for (const slot of slots) {
        const startMinutes = parseTime(slot.start);
        const endMinutes = parseTime(slot.end);
        if (startMinutes >= endMinutes) {
          pushToast({
            title: "Błąd",
            description: "Godzina początkowa musi być przed godziną końcową.",
            variant: "error",
          });
          return;
        }
        availabilities.push({ date, startMinutes, endMinutes });
      }
    }
    Object.keys(dayOffs).forEach((date) => {
      availabilities.push({
        date,
        startMinutes: 0,
        endMinutes: 0,
        status: "DAY_OFF",
      });
    });

    await onSave(availabilities);
  };

  if (!open) return null;

  const statusMeta = status ? getSubmissionStatusLabel(status) : null;

  return (
    <Modal
      open={open}
      title={employee ? `${employee.firstName} ${employee.lastName}` : "Ładowanie..."}
      description={employee?.position || employee?.email || undefined}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </>
      }
    >
      {loading ? (
        <AvailabilitySkeleton />
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {statusMeta && <span className={`badge ${statusMeta.tone}`}>{statusMeta.label}</span>}
          <div className="grid gap-2">
            <div className="grid grid-cols-7 text-xs text-surface-500 dark:text-surface-400">
              {WEEKDAYS.map((day) => (
                <span key={day.key} className="text-center py-1">
                  {day.shortLabel}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="h-16 rounded-lg bg-surface-50 dark:bg-surface-900/30" />;
                    }
                    const key = toDateKey(day);
                    const slots = calendarData[key] ?? [];
                    const isDayOff = !!dayOffs[key];
                    const isSelected = selectedDate === key;
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        onClick={() => setSelectedDate(key)}
                        className={`h-16 rounded-lg border text-left px-2 py-2 transition-colors ${
                          isSelected
                            ? "border-brand-500 bg-brand-50/60 dark:bg-brand-900/20"
                            : "border-surface-200/80 dark:border-surface-700/80 hover:border-brand-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-surface-900 dark:text-surface-50">
                            {day.getDate()}
                          </span>
                          {isDayOff && (
                            <span className="text-[9px] text-rose-600 dark:text-rose-400">
                              Wolne
                            </span>
                          )}
                          {!isDayOff && slots.length > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              {slots.length}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {selectedDate ? formatDate(selectedDate) : "Wybierz dzień"}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${isSelectedDayOff ? "badge-error" : "badge-success"}`}>
                {isSelectedDayOff ? "Dzień wolny" : "Dostępny"}
              </span>
              {!loading && !saving && selectedDate && (
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={toggleDayOff}
                >
                  {isSelectedDayOff ? "Usuń dzień wolny" : "Oznacz dzień wolny"}
                </button>
              )}
            </div>
            {slotsForSelected.length === 0 ? (
              <p className="text-xs text-surface-500">
                {isSelectedDayOff ? "Dzień wolny" : "Dostępny (domyślnie)"}
              </p>
            ) : (
              slotsForSelected.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    className="input py-1 px-2 text-sm w-24"
                    value={slot.start}
                    onChange={(e) => updateSlot(idx, "start", e.target.value)}
                  />
                  <span className="text-surface-400">–</span>
                  <input
                    type="time"
                    className="input py-1 px-2 text-sm w-24"
                    value={slot.end}
                    onChange={(e) => updateSlot(idx, "end", e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-600 p-1"
                    onClick={() => removeSlot(idx)}
                  >
                    Usuń
                  </button>
                </div>
              ))
            )}
            {!isSelectedDayOff && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_TEMPLATES.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => addTemplateSlot(template.key)}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn-secondary w-full" onClick={addSlot}>
                  + Dodaj przedział
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Create Window Modal
function CreateWindowModal({
  open,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; startDate: string; endDate: string; deadline: string }) => Promise<void>;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "Składanie dyspozycji",
    startDate: "",
    endDate: "",
    deadline: "",
  });

  const handleSubmit = () => {
    if (!formData.startDate || !formData.endDate || !formData.deadline) {
      pushToast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "error" });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      title="Otwórz okno składania dyspozycji"
      description="Ustaw okres, na który pracownicy mają podać swoją dostępność"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Tworzenie..." : "Utwórz okno"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Tytuł
          </label>
          <input
            type="text"
            className="input"
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Data początkowa
            </label>
            <input
              type="date"
              className="input"
              value={formData.startDate}
              onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Data końcowa
            </label>
            <input
              type="date"
              className="input"
              value={formData.endDate}
              onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Termin składania
          </label>
          <input
            type="date"
            className="input"
            value={formData.deadline}
            onChange={(e) => setFormData((f) => ({ ...f, deadline: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function DyspozycjePage() {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("my");
  const [activeWindows, setActiveWindows] = useState<AvailabilityWindowRecord[]>([]);
  const [allWindows, setAllWindows] = useState<AvailabilityWindowRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowSubmission, setWindowSubmission] = useState<AvailabilityWindowSubmissionResponse | null>(null);
  const [windowsLoading, setWindowsLoading] = useState(false);
  const [closeWindowId, setCloseWindowId] = useState<string | null>(null);
  const [closingWindow, setClosingWindow] = useState(false);

  // Team availability state
  const [teamStats, setTeamStats] = useState<TeamAvailabilityStatsResponse | null>(null);
  const [windowTeamStats, setWindowTeamStats] = useState<AvailabilityWindowTeamStats | null>(null);
  const [employees, setEmployees] = useState<EmployeeAvailabilitySummary[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", locationId: "", role: "" });

  // Employee detail panel state
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAvailabilityDetailResponse | null>(null);
  const [selectedWindowEmployee, setSelectedWindowEmployee] = useState<
    (EmployeeAvailabilityDetailResponse & {
      status: AvailabilitySubmissionStatus;
      submittedAt?: string | null;
      reviewedAt?: string | null;
    }) | null
  >(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeSaving, setEmployeeSaving] = useState(false);

  // Create window modal state
  const [createWindowOpen, setCreateWindowOpen] = useState(false);
  const [creatingWindow, setCreatingWindow] = useState(false);

  const activeWindow = activeWindows.length > 0 ? activeWindows[0] : null;
  const userIsAdmin = user ? isAdmin(user.role) : false;

  // Initial data load
  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([
      apiGetMe(),
      apiGetActiveAvailabilityWindows(),
      apiListLocations(),
    ])
      .then(async ([userData, windowsData, locationsData]) => {
        if (cancelled) return;

        setUser(userData);
        setActiveWindows(windowsData);
        setLocations(locationsData);

        if (windowsData[0]) {
          try {
            const submission = await apiGetMyWindowAvailability(windowsData[0].id);
            if (!cancelled) {
              setWindowSubmission(submission);
            }
          } catch (submissionError) {
            console.error(submissionError);
            if (!cancelled) {
              setWindowSubmission(null);
            }
          }
        }

        if (isAdmin(userData.role)) {
          setWindowsLoading(true);
          try {
            const allWindowsData = await apiGetAvailabilityWindows();
            if (!cancelled) {
              setAllWindows(allWindowsData);
            }
          } catch (err) {
            console.error(err);
            if (!cancelled) {
              pushToast({
                title: "Błąd",
                description: "Nie udało się pobrać listy okien dyspozycji",
                variant: "error",
              });
            }
          } finally {
            if (!cancelled) {
              setWindowsLoading(false);
            }
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Nie udało się pobrać danych");
          clearAuthTokens();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, router]);

  // Load team data when switching to team tab
  useEffect(() => {
    if (activeTab === "team" && userIsAdmin) {
      loadTeamData();
    }
  }, [activeTab, userIsAdmin, activeWindow]);

  useEffect(() => {
    if (!activeWindow) {
      setWindowSubmission(null);
      return;
    }

    let cancelled = false;

    apiGetMyWindowAvailability(activeWindow.id)
      .then((data) => {
        if (!cancelled) {
          setWindowSubmission(data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setWindowSubmission(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeWindow?.id]);

  const refreshWindows = useCallback(async () => {
    try {
      if (userIsAdmin) {
        setWindowsLoading(true);
      }
      const [active, all] = await Promise.all([
        apiGetActiveAvailabilityWindows(),
        userIsAdmin ? apiGetAvailabilityWindows() : Promise.resolve([]),
      ]);
      setActiveWindows(active);
      if (userIsAdmin) {
        setAllWindows(all);
      }
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się odświeżyć okien dyspozycji",
        variant: "error",
      });
    } finally {
      if (userIsAdmin) {
        setWindowsLoading(false);
      }
    }
  }, [userIsAdmin]);

  const loadTeamData = async () => {
    setTeamLoading(true);
    try {
      if (activeWindow) {
        const [statsData, employeesData] = await Promise.all([
          apiGetWindowTeamAvailabilityStats(activeWindow.id),
          apiGetWindowTeamAvailability(activeWindow.id, { page: 1, perPage: 50 }),
        ]);
        setWindowTeamStats(statsData);
        setTeamStats(null);
        setEmployees(employeesData.data);
      } else {
        const [statsData, employeesData] = await Promise.all([
          apiGetTeamAvailabilityStats(),
          apiGetTeamAvailability({ page: 1, perPage: 50 }),
        ]);
        setTeamStats(statsData);
        setWindowTeamStats(null);
        setEmployees(employeesData.data);
      }
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się pobrać danych zespołu", variant: "error" });
    } finally {
      setTeamLoading(false);
    }
  };

  const loadTeamEmployees = useCallback(async () => {
    if (!userIsAdmin) return;
    setTeamLoading(true);
    try {
      if (activeWindow) {
        const data = await apiGetWindowTeamAvailability(activeWindow.id, {
          search: filters.search || undefined,
          locationId: filters.locationId || undefined,
          role: filters.role || undefined,
          page: 1,
          perPage: 50,
        });
        setEmployees(data.data);
      } else {
        const data = await apiGetTeamAvailability({
          search: filters.search || undefined,
          locationId: filters.locationId || undefined,
          role: filters.role || undefined,
          page: 1,
          perPage: 50,
        });
        setEmployees(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTeamLoading(false);
    }
  }, [userIsAdmin, filters.search, filters.locationId, filters.role, activeWindow]);

  // Reload team employees when filters change
  useEffect(() => {
    if (activeTab === "team" && userIsAdmin) {
      loadTeamEmployees();
    }
  }, [activeTab, userIsAdmin, loadTeamEmployees]);

  const handleSaveWindowAvailability = useCallback(
    async (availabilities: AvailabilityInput[], submit: boolean) => {
      if (!activeWindow) return;
      setSaving(true);
      try {
        const data = await apiSaveMyWindowAvailability(activeWindow.id, {
          availabilities,
          submit,
        });
        setWindowSubmission(data);
        pushToast({
          title: "Sukces",
          description: submit
            ? "Dyspozycja została wysłana."
            : "Dyspozycja została zapisana jako wersja robocza.",
          variant: "success",
        });
      } catch (err) {
        console.error(err);
        pushToast({
          title: "Błąd",
          description: "Nie udało się zapisać dyspozycji",
          variant: "error",
        });
      } finally {
        setSaving(false);
      }
    },
    [activeWindow],
  );

  const handleEmployeeClick = async (employeeId: string) => {
    setEmployeeLoading(true);
    setSelectedEmployee(null);
    setSelectedWindowEmployee(null);
    try {
      if (activeWindow) {
        const data = await apiGetWindowEmployeeAvailability(activeWindow.id, employeeId);
        setSelectedWindowEmployee(data);
      } else {
        const data = await apiGetEmployeeAvailability(employeeId);
        setSelectedEmployee(data);
      }
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się pobrać danych pracownika", variant: "error" });
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleSaveEmployeeAvailability = async (availabilities: AvailabilityInput[]) => {
    if (!selectedEmployee && !selectedWindowEmployee) return;
    setEmployeeSaving(true);
    try {
      if (activeWindow && selectedWindowEmployee) {
        await apiUpdateWindowEmployeeAvailability(activeWindow.id, selectedWindowEmployee.employee.id, {
          availabilities,
        });
        pushToast({
          title: "Sukces",
          description: "Dyspozycje pracownika zostały zapisane i oznaczone jako zweryfikowane",
          variant: "success",
        });
        setSelectedWindowEmployee(null);
      } else if (selectedEmployee) {
        await apiUpdateEmployeeAvailability(selectedEmployee.employee.id, availabilities);
        pushToast({ title: "Sukces", description: "Dyspozycje pracownika zostały zapisane", variant: "success" });
        setSelectedEmployee(null);
      }
      loadTeamData();
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się zapisać dyspozycji", variant: "error" });
    } finally {
      setEmployeeSaving(false);
    }
  };

  const handleUpdateSubmissionStatus = async (
    employeeId: string,
    status: AvailabilitySubmissionStatus,
  ) => {
    if (!activeWindow) return;
    try {
      await apiUpdateWindowSubmissionStatus(activeWindow.id, employeeId, status);
      pushToast({
        title: "Zaktualizowano",
        description: "Status dyspozycji został zmieniony.",
        variant: "success",
      });
      loadTeamData();
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu.",
        variant: "error",
      });
    }
  };

  const handleCreateWindow = async (data: { title: string; startDate: string; endDate: string; deadline: string }) => {
    setCreatingWindow(true);
    try {
      const newWindow = await apiCreateAvailabilityWindow({
        title: data.title,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        deadline: new Date(data.deadline).toISOString(),
        isOpen: true,
      });
      setActiveWindows([newWindow]);
      setAllWindows([newWindow, ...allWindows]);
      setWindowSubmission(null);
      setCreateWindowOpen(false);
      pushToast({ title: "Sukces", description: "Okno składania dyspozycji zostało utworzone", variant: "success" });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się utworzyć okna", variant: "error" });
    } finally {
      setCreatingWindow(false);
    }
  };

  const windowToClose = closeWindowId ? allWindows.find((window) => window.id === closeWindowId) ?? null : null;

  const handleCloseWindow = async () => {
    if (!windowToClose) return;
    setClosingWindow(true);
    try {
      await apiCloseAvailabilityWindow(windowToClose.id);
      pushToast({
        title: "Zamknięto okno",
        description: "Okno dyspozycji zostało zamknięte.",
        variant: "success",
      });
      await refreshWindows();
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zamknąć okna dyspozycji",
        variant: "error",
      });
    } finally {
      setClosingWindow(false);
      setCloseWindowId(null);
    }
  };

  if (!hasSession) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Ładowanie dyspozycji...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Dyspozycje</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Zarządzaj dostępnością {userIsAdmin ? "swojego zespołu" : "swoją"} do układania grafiku pracy
          </p>
        </div>
        {userIsAdmin && (
          <div className="flex items-center gap-2">
            {!activeWindow && (
              <button
                onClick={() => setCreateWindowOpen(true)}
                className="btn-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Otwórz okno dyspozycji
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs (only for admins) */}
      {userIsAdmin && (
        <div className="flex gap-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("my")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "my"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Moja dyspozycyjność
              </span>
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "team"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Dyspozycyjność zespołu
              </span>
            </button>
        </div>
      )}

      {/* Availability Window Status */}
      <WindowStatusCard
        window={activeWindow}
        isAdmin={userIsAdmin}
        onOpenWindow={() => setCreateWindowOpen(true)}
      />

      {userIsAdmin && (
        <AvailabilityWindowsList
          windows={allWindows}
          loading={windowsLoading}
          onRequestClose={(windowId) => setCloseWindowId(windowId)}
        />
      )}

      {/* Tab Content */}
      {activeTab === "my" ? (
        activeWindow ? (
          <MonthlyAvailabilityTab
            window={activeWindow}
            submission={windowSubmission}
            saving={saving}
            onSave={handleSaveWindowAvailability}
          />
        ) : (
          <div className="card p-5">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              Brak aktywnego okna dyspozycji
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">
              Aktualnie nie ma otwartego okna na składanie dyspozycji. Poczekaj na informację od pracodawcy.
            </p>
          </div>
        )
      ) : activeWindow ? (
        <WindowTeamAvailabilityTab
          window={activeWindow}
          stats={windowTeamStats}
          employees={employees}
          loading={teamLoading}
          onSelectEmployee={handleEmployeeClick}
          onUpdateStatus={handleUpdateSubmissionStatus}
        />
      ) : (
        <TeamAvailabilityTab
          stats={teamStats}
          employees={employees}
          locations={locations}
          filters={filters}
          setFilters={setFilters}
          loading={teamLoading}
          onEmployeeClick={handleEmployeeClick}
        />
      )}

      {/* Employee Detail Panel */}
      <EmployeeDetailPanel
        open={!activeWindow && (!!selectedEmployee || employeeLoading)}
        employee={selectedEmployee?.employee || null}
        availability={selectedEmployee?.availability || []}
        loading={employeeLoading}
        saving={employeeSaving}
        onClose={() => setSelectedEmployee(null)}
        onSave={handleSaveEmployeeAvailability}
      />

      <WindowEmployeeDetailPanel
        open={!!activeWindow && (!!selectedWindowEmployee || employeeLoading)}
        employee={selectedWindowEmployee?.employee || null}
        availability={selectedWindowEmployee?.availability || []}
        window={activeWindow}
        status={selectedWindowEmployee?.status ?? null}
        loading={employeeLoading}
        saving={employeeSaving}
        onClose={() => setSelectedWindowEmployee(null)}
        onSave={handleSaveEmployeeAvailability}
      />

      <Modal
        open={!!windowToClose}
        title="Zamknąć okno dyspozycji?"
        description={windowToClose?.title}
        onClose={() => setCloseWindowId(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCloseWindowId(null)}>
              Anuluj
            </button>
            <button
              className="btn-primary"
              onClick={handleCloseWindow}
              disabled={closingWindow}
            >
              {closingWindow ? "Zamykanie..." : "Zamknij okno"}
            </button>
          </>
        }
      >
        <p className="text-sm text-surface-600 dark:text-surface-300">
          Czy na pewno chcesz zamknąć to okno? Pracownicy nie będą mogli już składać nowych dyspozycji w tym okresie.
        </p>
      </Modal>

      {/* Create Window Modal */}
      <CreateWindowModal
        open={createWindowOpen}
        onClose={() => setCreateWindowOpen(false)}
        onSubmit={handleCreateWindow}
        saving={creatingWindow}
      />
    </div>
  );
}
