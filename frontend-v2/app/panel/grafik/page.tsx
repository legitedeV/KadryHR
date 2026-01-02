"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EmployeeRecord,
  LocationRecord,
  ShiftPayload,
  ShiftRecord,
  ShiftSummaryItem,
  apiCreateShift,
  apiDeleteShift,
  apiGetShiftSummary,
  apiGetShifts,
  apiListEmployees,
  apiListLocations,
  apiUpdateShift,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pushToast } from "@/lib/toast";

type ShiftModalState = {
  mode: "create" | "edit";
  shift?: ShiftRecord;
  date?: string;
  employeeId?: string;
};

const manageableRoles = ["OWNER", "MANAGER", "ADMIN"] as const;
const weekDayLabels = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function startOfWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // 1=Mon, 7=Sun
  if (day !== 1) {
    d.setUTCDate(d.getUTCDate() - (day - 1));
  }
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function isSameDay(iso: string, day: Date) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === day.getUTCFullYear() &&
    d.getUTCMonth() === day.getUTCMonth() &&
    d.getUTCDate() === day.getUTCDate()
  );
}

function combineDateWithTime(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00.000Z`).toISOString();
}

function moveToDay(sourceIso: string, targetDay: Date) {
  const src = new Date(sourceIso);
  return new Date(
    Date.UTC(
      targetDay.getUTCFullYear(),
      targetDay.getUTCMonth(),
      targetDay.getUTCDate(),
      src.getUTCHours(),
      src.getUTCMinutes(),
    ),
  ).toISOString();
}

function formatEmployeeName(
  shift: ShiftRecord,
  employees: EmployeeRecord[],
): string {
  const found = employees.find((e) => e.id === shift.employeeId);
  if (found) {
    const name = `${found.firstName ?? ""} ${found.lastName ?? ""}`.trim();
    return name || found.email || "Pracownik";
  }

  const name = `${shift.employee?.firstName ?? ""} ${shift.employee?.lastName ?? ""}`.trim();
  return name || "Pracownik";
}

function formatLocationName(shift: ShiftRecord, locations: LocationRecord[]) {
  const loc = locations.find((l) => l.id === shift.locationId);
  return loc?.name ?? shift.location?.name ?? "Lokalizacja";
}

export default function GrafikPage() {
  const { user } = useAuth();
  const canManage = user ? manageableRoles.includes(user.role as (typeof manageableRoles)[number]) : false;
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [summary, setSummary] = useState<ShiftSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ employeeId?: string; locationId?: string }>({});
  const [modalState, setModalState] = useState<ShiftModalState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ShiftRecord | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const range = useMemo(() => {
    const from = isoDate(weekStart);
    const to = isoDate(addDays(weekStart, 6));
    return { from, to };
  }, [weekStart]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [emps, locs] = await Promise.all([
          apiListEmployees({ take: 200, skip: 0 }),
          apiListLocations(),
        ]);
        setEmployees(emps.data ?? []);
        setLocations(locs ?? []);
      } catch (err) {
        console.error(err);
        pushToast({
          title: "Błąd",
          description: "Nie udało się pobrać listy pracowników i lokalizacji",
          variant: "error",
        });
      }
    };
    bootstrap();
  }, []);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, summaryRes] = await Promise.all([
        apiGetShifts({
          from: range.from,
          to: range.to,
          locationId: filters.locationId || undefined,
          employeeId: filters.employeeId || undefined,
        }),
        apiGetShiftSummary({
          from: range.from,
          to: range.to,
          employeeId: filters.employeeId || undefined,
        }),
      ]);
      setShifts(data);
      setSummary(summaryRes);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać grafiku z backendu");
    } finally {
      setLoading(false);
    }
  }, [filters.employeeId, filters.locationId, range.from, range.to]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, idx) => addDays(weekStart, idx)),
    [weekStart],
  );

  const rows = useMemo(() => {
    let base = employees;
    if (filters.locationId) {
      base = base.filter((e) => e.locations.some((l) => l.id === filters.locationId));
    }
    if (filters.employeeId) {
      base = base.filter((e) => e.id === filters.employeeId);
    }
    if (base.length > 0) return base;

    const fromShifts = Array.from(
      new Map(
        shifts.map((s) => [
          s.employeeId,
          {
            id: s.employeeId,
            firstName: s.employee?.firstName ?? "",
            lastName: s.employee?.lastName ?? "",
            email: "",
            phone: "",
            position: "",
            locations: [],
            createdAt: "",
            updatedAt: "",
          } as EmployeeRecord,
        ]),
      ).values(),
    );
    return fromShifts;
  }, [employees, filters.employeeId, filters.locationId, shifts]);

  const shiftsByEmployeeDay = useMemo(() => {
    const map = new Map<string, ShiftRecord[]>();
    shifts.forEach((shift) => {
      weekDays.forEach((day) => {
        if (isSameDay(shift.startsAt, day)) {
          const key = `${shift.employeeId}-${isoDate(day)}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(shift);
        }
      });
    });
    return map;
  }, [shifts, weekDays]);

  const handleSave = async (payload: ShiftPayload, shiftId?: string) => {
    try {
      const result = shiftId
        ? await apiUpdateShift(shiftId, payload)
        : await apiCreateShift(payload);
      if (result.availabilityWarning) {
        pushToast({
          title: "Uwaga",
          description: result.availabilityWarning,
          variant: "warning",
        });
      }
      pushToast({
        title: shiftId ? "Zaktualizowano zmianę" : "Dodano zmianę",
        variant: "success",
      });
      setModalState(null);
      await loadShifts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać zmiany";
      console.error(err);
      pushToast({
        title: "Błąd",
        description: message,
        variant: "error",
      });
      throw err;
    }
  };

  const handleDrop = async (employeeId: string, day: Date) => {
    if (!draggingId) return;
    const shift = shifts.find((s) => s.id === draggingId);
    setDraggingId(null);
    if (!shift) return;

    const nextStartsAt = moveToDay(shift.startsAt, day);
    const nextEndsAt = moveToDay(shift.endsAt, day);
    try {
      await handleSave(
        {
          employeeId,
          locationId: shift.locationId ?? undefined,
          position: shift.position ?? undefined,
          notes: shift.notes ?? undefined,
          startsAt: nextStartsAt,
          endsAt: nextEndsAt,
        },
        shift.id,
      );
    } catch {
      pushToast({
        title: "Błąd przenoszenia",
        description: "Nie udało się przenieść zmiany. Zmiany cofnięto.",
        variant: "error",
      });
    }
  };

  const totalHoursInWeek = useMemo(
    () =>
      shifts.reduce((sum, s) => {
        const duration =
          (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / (1000 * 60 * 60);
        return sum + Math.max(duration, 0);
      }, 0),
    [shifts],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Grafik
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Zakres: {weekDays[0]?.toLocaleDateString("pl-PL")} –{" "}
            {weekDays[6]?.toLocaleDateString("pl-PL")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Poprzedni tydzień
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Dziś
          </button>
          <button
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Następny tydzień
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">Pracownik</span>
            <select
              value={filters.employeeId ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  employeeId: e.target.value || undefined,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Wszyscy</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {`${e.firstName} ${e.lastName}`.trim() || e.email || "Pracownik"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">Lokalizacja</span>
            <select
              value={filters.locationId ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  locationId: e.target.value || undefined,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Wszystkie</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-slate-500 dark:text-slate-400">
            Zmian w tygodniu: {shifts.length} · Łącznie godzin: {Math.round(totalHoursInWeek)}
          </span>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900/70"
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Pracownik
                  </th>
                  {weekDays.map((day, idx) => (
                    <th
                      key={isoDate(day)}
                      className="px-3 py-2 text-left text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {weekDayLabels[idx]}
                        </span>
                        <span>{day.toLocaleDateString("pl-PL")}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={weekDays.length + 1}
                      className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                    >
                      Brak pracowników spełniających kryteria.
                    </td>
                  </tr>
                )}
                {rows.map((employee) => (
                  <tr key={employee.id} className="align-top">
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                      {`${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
                        employee.email ||
                        "Pracownik"}
                    </td>
                    {weekDays.map((day) => {
                      const cellKey = `${employee.id}-${isoDate(day)}`;
                      const cellShifts = shiftsByEmployeeDay.get(cellKey) ?? [];
                      return (
                        <td
                          key={cellKey}
                          className="px-2 py-2 min-w-[160px]"
                          onDragOver={(e) => {
                            if (canManage) e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (canManage) handleDrop(employee.id, day);
                          }}
                        >
                          <div className="flex flex-col gap-2">
                            {cellShifts.map((shift) => (
                              <div
                                key={shift.id}
                                draggable={canManage}
                                onDragStart={() => setDraggingId(shift.id)}
                                onDragEnd={() => setDraggingId(null)}
                                onClick={() =>
                                  canManage &&
                                  setModalState({
                                    mode: "edit",
                                    shift,
                                  })
                                }
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900/80"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                                    {timeLabel(shift.startsAt)}–{timeLabel(shift.endsAt)}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {formatLocationName(shift, locations)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                  {formatEmployeeName(shift, employees)}
                                  {shift.position ? ` · ${shift.position}` : ""}
                                </p>
                                {shift.availabilityWarning && (
                                  <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800">
                                    {shift.availabilityWarning}
                                  </span>
                                )}
                              </div>
                            ))}
                            {canManage && (
                              <button
                                onClick={() =>
                                  setModalState({
                                    mode: "create",
                                    date: isoDate(day),
                                    employeeId: employee.id,
                                  })
                                }
                                className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-500 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:hover:border-brand-400 dark:hover:text-brand-300"
                              >
                                + Dodaj zmianę
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Zmiany</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {shifts.length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Łącznie godzin: {Math.round(totalHoursInWeek)}
            </p>
          </div>
          <div className="card p-3 sm:col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Podsumowanie tygodniowe
            </p>
            {summary.length === 0 ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Brak danych do podsumowania.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 text-[11px]">
                {summary.map((item) => (
                  <span
                    key={item.employeeId}
                    className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {item.employeeName}: {item.hours} h
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalState && (
        <ShiftModal
          key={modalState.shift?.id ?? modalState.date ?? modalState.employeeId ?? "new-shift"}
          open
          mode={modalState.mode}
          shift={modalState.shift}
          defaultDate={modalState.date}
          defaultEmployeeId={modalState.employeeId}
          employees={employees}
          locations={locations}
          canManage={canManage}
          onClose={() => setModalState(null)}
          onDelete={() => {
            if (modalState.shift) setConfirmDelete(modalState.shift);
          }}
          onSubmit={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Usuń zmianę"
          description="Czy na pewno chcesz usunąć tę zmianę?"
          confirmLabel="Usuń"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try {
              await apiDeleteShift(confirmDelete.id);
              pushToast({ title: "Usunięto zmianę", variant: "success" });
              setConfirmDelete(null);
              await loadShifts();
            } catch (err) {
              console.error(err);
              pushToast({
                title: "Błąd",
                description: "Nie udało się usunąć zmiany",
                variant: "error",
              });
            }
          }}
        />
      )}
    </div>
  );
}

type ShiftModalProps = {
  open: boolean;
  mode: "create" | "edit";
  shift?: ShiftRecord;
  defaultDate?: string;
  defaultEmployeeId?: string;
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  canManage: boolean;
  onClose: () => void;
  onSubmit: (payload: ShiftPayload, shiftId?: string) => Promise<void>;
  onDelete: () => void;
};

function ShiftModal({
  open,
  mode,
  shift,
  defaultDate,
  defaultEmployeeId,
  employees,
  locations,
  onClose,
  onSubmit,
  onDelete,
  canManage,
}: ShiftModalProps) {
  const [date, setDate] = useState(
    shift ? isoDate(new Date(shift.startsAt)) : defaultDate ?? isoDate(new Date()),
  );
  const [startTime, setStartTime] = useState(shift ? timeLabel(shift.startsAt) : "09:00");
  const [endTime, setEndTime] = useState(shift ? timeLabel(shift.endsAt) : "17:00");
  const [employeeId, setEmployeeId] = useState(
    shift?.employeeId ?? defaultEmployeeId ?? employees[0]?.id ?? "",
  );
  const [locationId, setLocationId] = useState(shift?.locationId ?? "");
  const [position, setPosition] = useState(shift?.position ?? "");
  const [notes, setNotes] = useState(shift?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    const startsAt = combineDateWithTime(date, startTime);
    const endsAt = combineDateWithTime(date, endTime);
    if (new Date(startsAt) >= new Date(endsAt)) {
      setError("Godzina zakończenia musi być po godzinie rozpoczęcia");
      return;
    }
    if (!employeeId) {
      setError("Pracownik jest wymagany");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          employeeId,
          locationId: locationId || undefined,
          position: position || undefined,
          notes: notes || undefined,
          startsAt,
          endsAt,
        },
        shift?.id,
      );
    } catch {
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {mode === "edit" ? "Edytuj zmianę" : "Nowa zmiana"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uzupełnij szczegóły zmiany i zapisz.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Data
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Pracownik
            <select
              value={employeeId}
              disabled={!canManage}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {`${e.firstName} ${e.lastName}`.trim() || e.email || "Pracownik"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Start
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Koniec
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Lokalizacja
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">Dowolna</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Stanowisko
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
              placeholder="Sprzedawca / Manager"
            />
          </label>
        </div>

        <label className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300 block">
          Notatki
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
            rows={3}
            placeholder="Opcjonalne uwagi do zmiany"
          />
        </label>

        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          {mode === "edit" && (
            <button
              onClick={onDelete}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100"
            >
              Usuń
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Anuluj
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-70"
            >
              {saving ? "Zapisywanie..." : mode === "edit" ? "Zapisz zmiany" : "Dodaj"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-4 flex justify-end gap-2 text-xs">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
