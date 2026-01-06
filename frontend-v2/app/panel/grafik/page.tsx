"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { Modal } from "@/components/Modal";
import {
  EmployeeRecord,
  LocationRecord,
  ShiftPayload,
  ShiftRecord,
  apiCreateShift,
  apiDeleteShift,
  apiGetShifts,
  apiListEmployees,
  apiListLocations,
  apiPublishSchedule,
  apiUpdateShift,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type ShiftDisplay = {
  id: string;
  date: string;
  start: string;
  end: string;
  employeeName: string;
  employeeId?: string;
  employeeAvatar?: string | null;
  locationName: string;
  locationId?: string | null;
  status: "ASSIGNED" | "UNASSIGNED";
  availabilityWarning?: string | null;
  position?: string | null;
};

type ShiftFormState = {
  employeeId: string;
  locationId?: string;
  position?: string;
  notes?: string;
  date: string;
  startTime: string;
  endTime: string;
};

type WeekRange = { from: string; to: string; label: string };

function getWeekRange(anchor: Date = new Date()): WeekRange {
  const day = anchor.getDay() || 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: fmt(monday),
    to: fmt(sunday),
    label: `${monday.toLocaleDateString("pl-PL")} – ${sunday.toLocaleDateString("pl-PL")}`,
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

function formatTime(date: Date) {
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapShiftRecord(record: ShiftRecord, employees: EmployeeRecord[], locations: LocationRecord[]): ShiftDisplay {
  const startDate = new Date(record.startsAt);
  const endDate = new Date(record.endsAt);
  const employee =
    (record.employeeId && employees.find((e) => e.id === record.employeeId)) || record.employee;
  const employeeName = employee
    ? `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
      ("email" in employee ? (employee as EmployeeRecord).email ?? "" : "") ||
      "Pracownik"
    : "Nieprzypisana";
  const location =
    (record.locationId && locations.find((loc) => loc.id === record.locationId)) || record.location;
  const locationName = location?.name ?? "Brak lokalizacji";

  return {
    id: record.id,
    date: startDate.toISOString().slice(0, 10),
    start: formatTime(startDate),
    end: formatTime(endDate),
    employeeName,
    employeeId: record.employeeId,
    employeeAvatar: record.employee?.avatarUrl ?? null,
    locationName,
    locationId: record.locationId,
    status: record.employeeId ? "ASSIGNED" : "UNASSIGNED",
    availabilityWarning: record.availabilityWarning ?? null,
    position: record.position,
  };
}

function getDowKey(date: string) {
  const d = new Date(date);
  const idx = d.getDay(); // 0 = Sun
  if (Number.isNaN(idx) || idx < 0 || idx > 6) return "Sun";
  return dowFromDate[idx] ?? "Sun";
}

export function buildShiftDescription(
  shift: ShiftRecord,
  employees: EmployeeRecord[],
  locations: LocationRecord[],
) {
  const employee = employees.find((e) => e.id === shift.employeeId);
  const location = locations.find((loc) => loc.id === shift.locationId);
  const startDate = new Date(shift.startsAt);
  const endDate = new Date(shift.endsAt);
  const employeeLabel = employee
    ? `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Pracownik"
    : "Nieprzypisana";
  const dateLabel = startDate.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = `${formatTime(startDate)}–${formatTime(endDate)}`;
  const locationLabel = location?.name ?? "Bez lokalizacji";

  return `${employeeLabel} • ${dateLabel} • ${timeLabel} • ${locationLabel}`;
}

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  open?: boolean;
  forceRender?: boolean;
  portalTarget?: HTMLElement | null;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  onConfirm,
  onCancel,
  open = true,
  forceRender = false,
  portalTarget,
}: ConfirmDialogProps) {
  const shouldRender = forceRender || open;
  if (!shouldRender) return null;

  const dialog = (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated ring-1 ring-surface-200 dark:bg-surface-900 dark:ring-surface-700">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">{title}</h2>
          <p className="text-sm text-surface-600 dark:text-surface-300">{description}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  const target = portalTarget ?? (typeof document !== "undefined" ? document.body : null);
  if (target) {
    return createPortal(dialog, target);
  }

  return dialog;
}

function buildPayloadFromForm(form: ShiftFormState): ShiftPayload {
  const startsAt = new Date(`${form.date}T${form.startTime}:00`);
  const endsAt = new Date(`${form.date}T${form.endTime}:00`);
  return {
    employeeId: form.employeeId,
    locationId: form.locationId || undefined,
    position: form.position || undefined,
    notes: form.notes || undefined,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export default function GrafikPage() {
  const [range, setRange] = useState<WeekRange>(() => getWeekRange());
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const hasToken = useMemo(() => !!getAccessToken(), []);
  const [loading, setLoading] = useState(hasToken);
  const [error, setError] = useState<string | null>(
    hasToken ? null : "Zaloguj się, aby zobaczyć grafik.",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftRecord | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);
  const [form, setForm] = useState<ShiftFormState>(() => ({
    employeeId: "",
    locationId: undefined,
    position: "",
    notes: "",
    date: range.from,
    startTime: "09:00",
    endTime: "17:00",
  }));

  useEffect(() => {
    if (!hasToken) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiListEmployees({ take: 100, skip: 0 }),
      apiListLocations(),
      apiGetShifts({ from: range.from, to: range.to }),
    ])
      .then(([employeeResponse, locationResponse, shiftResponse]) => {
        if (!isMounted) return;
        setEmployees(employeeResponse.data);
        setLocations(locationResponse);
        setShifts(shiftResponse);
        if (!employeeResponse.data.length) {
          setFormError("Dodaj pracowników, aby przypisać ich do zmian.");
        }
      })
      .catch((err) => {
        console.error(err);
        if (!isMounted) return;
        setError("Nie udało się pobrać grafiku z backendu");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hasToken, range.from, range.to]);

  const byDay: Record<string, ShiftDisplay[]> = useMemo(() => {
    const grouped: Record<string, ShiftDisplay[]> = {};
    dowOrder.forEach((k) => (grouped[k] = []));
    shifts.forEach((s) => {
      const display = mapShiftRecord(s, employees, locations);
      const key = getDowKey(display.date);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(display);
    });
    return grouped;
  }, [employees, locations, shifts]);

  // Grid structure: employees as rows, days as columns
  const gridByEmployeeAndDay: Record<string, Record<string, ShiftDisplay[]>> = useMemo(() => {
    const grid: Record<string, Record<string, ShiftDisplay[]>> = {};
    
    // Initialize grid for all employees
    employees.forEach((emp) => {
      grid[emp.id] = {};
      dowOrder.forEach((dow) => {
        grid[emp.id][dow] = [];
      });
    });

    // Populate grid with shifts
    shifts.forEach((s) => {
      const display = mapShiftRecord(s, employees, locations);
      if (!display.employeeId) return; // Skip unassigned shifts
      const key = getDowKey(display.date);
      if (grid[display.employeeId] && grid[display.employeeId][key]) {
        grid[display.employeeId][key].push(display);
      }
    });

    return grid;
  }, [employees, shifts, locations]);

  const handleWeekChange = (direction: "next" | "prev") => {
    const currentStart = new Date(range.from);
    const delta = direction === "next" ? 7 : -7;
    currentStart.setDate(currentStart.getDate() + delta);
    setRange(getWeekRange(currentStart));
  };

  const resetForm = (date?: string, employeeId?: string) => {
    setForm({
      employeeId: employeeId ?? employees[0]?.id ?? "",
      locationId: locations[0]?.id,
      position: "",
      notes: "",
      date: date ?? range.from,
      startTime: "09:00",
      endTime: "17:00",
    });
    setEditingShift(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const openCreateModal = (date?: string, employeeId?: string) => {
    resetForm(date, employeeId);
    setEditorOpen(true);
  };

  const openEditModal = (shift: ShiftRecord) => {
    const startDate = new Date(shift.startsAt);
    const endDate = new Date(shift.endsAt);
    setForm({
      employeeId: shift.employeeId ?? "",
      locationId: shift.locationId ?? undefined,
      position: shift.position ?? "",
      notes: shift.notes ?? "",
      date: startDate.toISOString().slice(0, 10),
      startTime: startDate.toISOString().slice(11, 16),
      endTime: endDate.toISOString().slice(11, 16),
    });
    setEditingShift(shift);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.employeeId) {
      setFormError("Wybierz pracownika, aby zapisać zmianę.");
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);
    if (start >= end) {
      setFormError("Godzina zakończenia musi być po godzinie rozpoczęcia.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingShift) {
        const updated = await apiUpdateShift(editingShift.id, buildPayloadFromForm(form));
        setShifts((prev) => prev.map((s) => (s.id === editingShift.id ? updated : s)));
        setFormSuccess("Zmiana została zaktualizowana.");
      } else {
        const created = await apiCreateShift(buildPayloadFromForm(form));
        setShifts((prev) => [created, ...prev]);
        setFormSuccess("Zmiana została dodana.");
      }
      setEditorOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się zapisać zmiany. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDeleteShift(deleteTarget.id);
      setShifts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
      setError("Nie udało się usunąć zmiany.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openPublishModal = () => {
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    const employeeIds = Array.from(new Set(shifts.map((s) => s.employeeId).filter(Boolean))) as string[];
    if (employeeIds.length === 0) {
      setFormError("Brak obsadzonych zmian w tym tygodniu do powiadomienia.");
      return;
    }
    setPublishing(true);
    setFormError(null);
    try {
      const result = await apiPublishSchedule({
        employeeIds,
        dateRange: { from: range.from, to: range.to },
      });
      setFormSuccess(`Powiadomiono ${result.notified} pracowników o grafiku.`);
      setPublishOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się opublikować grafiku.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label">Grafik</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">Tydzień: {range.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Łącznie zmian: <span className="font-semibold text-surface-900 dark:text-surface-100">{shifts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => handleWeekChange("prev")} aria-label="Poprzedni tydzień">
              ← Poprzedni
            </button>
            <button className="btn-secondary" onClick={() => handleWeekChange("next")} aria-label="Następny tydzień">
              Następny →
            </button>
          </div>
          <button className="btn-secondary" onClick={openPublishModal}>
            Opublikuj tydzień
          </button>
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

      {error && !loading && (
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
              {formSuccess && <span className="text-sm text-emerald-700 dark:text-emerald-200">{formSuccess}</span>}
            </div>
            {formError && <div className="text-sm text-rose-600 dark:text-rose-300">{formError}</div>}
          </div>

          <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
            <table className="min-w-full">
              <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 sticky left-0 bg-surface-50/80 dark:bg-surface-900/80 z-10">
                    Pracownik
                  </th>
                  {dowLabels.map((dayLabel, idx) => {
                    const dayDate = new Date(range.from);
                    dayDate.setDate(dayDate.getDate() + idx);
                    return (
                      <th key={dayLabel} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 min-w-[180px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{dayLabel}</span>
                          <span className="font-normal text-[10px] text-surface-400 dark:text-surface-500">
                            {dayDate.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" })}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-surface-500 dark:text-surface-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Brak pracowników. Dodaj pracowników, aby tworzyć grafik.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => {
                    const employeeShifts = gridByEmployeeAndDay[employee.id] || {};
                    return (
                      <tr key={employee.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-white dark:bg-surface-900/50 z-10 border-r border-surface-100 dark:border-surface-800">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={`${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Pracownik"}
                              src={employee.avatarUrl}
                              size="md"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-surface-900 dark:text-surface-50 truncate">
                                {`${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Pracownik"}
                              </span>
                              {employee.position && (
                                <span className="text-xs text-surface-500 dark:text-surface-400 truncate">
                                  {employee.position}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {dowOrder.map((dow, dayIdx) => {
                          const dayShifts = employeeShifts[dow] || [];
                          const dayDate = new Date(range.from);
                          dayDate.setDate(dayDate.getDate() + dayIdx);
                          const dayDateValue = dayDate.toISOString().slice(0, 10);
                          return (
                            <td key={dow} className="px-3 py-3 align-top">
                              <div className="flex flex-col gap-2 min-h-[60px]">
                                {dayShifts.length === 0 ? (
                                  <button
                                    className="w-full h-full min-h-[60px] rounded-lg border border-dashed border-surface-200 hover:border-brand-300 hover:bg-brand-50/30 dark:border-surface-700 dark:hover:border-brand-700 dark:hover:bg-brand-950/20 transition-colors flex items-center justify-center group"
                                    onClick={() => openCreateModal(dayDateValue, employee.id)}
                                    aria-label={`Dodaj zmianę dla ${employee.firstName} ${employee.lastName} na ${dowLabels[dayIdx]}`}
                                  >
                                    <svg className="w-5 h-5 text-surface-400 group-hover:text-brand-600 dark:text-surface-500 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                ) : (
                                  <>
                                    {dayShifts.map((shift) => {
                                      const sourceShift = shifts.find((s) => s.id === shift.id);
                                      return (
                                        <div
                                          key={shift.id}
                                          className="group relative rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/30 px-2 py-2 shadow-sm hover:shadow-md transition-all text-xs"
                                        >
                                          <div className="flex items-start justify-between gap-1">
                                            <div className="flex-1 min-w-0">
                                              <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                                                {shift.start}–{shift.end}
                                              </div>
                                              {shift.locationName && shift.locationName !== "Brak lokalizacji" && (
                                                <div className="text-[10px] text-surface-600 dark:text-surface-300 mt-0.5 truncate">
                                                  {shift.locationName}
                                                </div>
                                              )}
                                              {shift.position && (
                                                <div className="text-[10px] uppercase tracking-wide text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                                                  {shift.position}
                                                </div>
                                              )}
                                              {shift.availabilityWarning && (
                                                <div className="mt-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:ring-amber-800/70">
                                                  {shift.availabilityWarning}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                className="text-[10px] text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                                                onClick={() => sourceShift && openEditModal(sourceShift)}
                                                aria-label="Edytuj zmianę"
                                              >
                                                ✎
                                              </button>
                                              <button
                                                className="text-[10px] text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium"
                                                onClick={() => setDeleteTarget(sourceShift || null)}
                                                aria-label="Usuń zmianę"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <button
                                      className="w-full rounded-lg border border-dashed border-surface-200 hover:border-brand-300 hover:bg-brand-50/30 dark:border-surface-700 dark:hover:border-brand-700 dark:hover:bg-brand-950/20 transition-colors py-1.5 flex items-center justify-center group"
                                      onClick={() => openCreateModal(dayDateValue, employee.id)}
                                      aria-label={`Dodaj kolejną zmianę dla ${employee.firstName} ${employee.lastName} na ${dowLabels[dayIdx]}`}
                                    >
                                      <svg className="w-4 h-4 text-surface-400 group-hover:text-brand-600 dark:text-surface-500 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={editorOpen}
        title={editingShift ? "Edytuj zmianę" : "Dodaj zmianę"}
        description="Uzupełnij szczegóły zmiany i przypisz pracownika."
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditorOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Pracownik
            <select
              className="input"
              value={form.employeeId}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
            >
              <option value="">Wybierz pracownika</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.email}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Lokalizacja
            <select
              className="input"
              value={form.locationId ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value || undefined }))}
            >
              <option value="">Brak lokalizacji</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Data
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Godzina startu
            <input
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Godzina końca
            <input
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Stanowisko / rola
            <input
              type="text"
              className="input"
              value={form.position}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              placeholder="np. Barista"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Notatki
            <textarea
              className="input min-h-[90px]"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Dodatkowe instrukcje dla zmiany"
            />
          </label>
        </div>

        {formError && (
          <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>
        )}
      </Modal>

      <Modal
        open={publishOpen}
        title="Opublikuj grafik"
        description="Powiadom pracowników o opublikowaniu grafiku na wybrany tydzień."
        onClose={() => setPublishOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPublishOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publikowanie..." : "Wyślij powiadomienia"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-surface-700 dark:text-surface-200">
          <p>
            Zakres: <span className="font-semibold">{range.label}</span>
          </p>
          <p>Powiadomienia zostaną wysłane do wszystkich pracowników przypisanych do zmian w tym tygodniu.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Usuń zmianę"
        description={
          deleteTarget
            ? buildShiftDescription(deleteTarget, employees, locations)
            : "Czy na pewno chcesz usunąć zmianę?"
        }
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
