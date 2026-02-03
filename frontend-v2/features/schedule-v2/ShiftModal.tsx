"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import {
  AvailabilityRecord,
  ApprovedLeaveRecord,
  EmployeeRecord,
  LocationRecord,
  ShiftPayload,
  ShiftRecord,
} from "@/lib/api";
import {
  extractBreakMinutes,
  addDays,
  formatDateKey,
  getAvailabilityStatus,
  mergeNotesWithBreak,
  parseTimeToMinutes,
} from "./schedule-utils";
import { EmployeeInline } from "./EmployeeInline";

const TIME_PRESETS = [
  { value: "06:00-14:30", label: "06:00–14:30" },
  { value: "08:00-14:00", label: "08:00–14:00" },
  { value: "10:00-16:00", label: "10:00–16:00" },
  { value: "12:00-18:00", label: "12:00–18:00" },
  { value: "14:00-22:00", label: "14:00–22:00" },
  { value: "14:30-23:00", label: "14:30–23:00" },
] as const;

const WEEKDAY_OPTIONS = [
  { label: "Pon", value: 1 },
  { label: "Wt", value: 2 },
  { label: "Śr", value: 3 },
  { label: "Czw", value: 4 },
  { label: "Pt", value: 5 },
  { label: "Sob", value: 6 },
  { label: "Niedz", value: 0 },
] as const;

type ShiftModalProps = {
  open: boolean;
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  availability: AvailabilityRecord[];
  leaves: ApprovedLeaveRecord[];
  shift?: ShiftRecord | null;
  initialDate?: Date | null;
  lockedEmployeeId?: string | null;
  positionOptions?: string[];
  onClose: () => void;
  onSave: (payload: ShiftPayload, shiftId?: string) => Promise<void>;
  onSaveBulk: (payloads: ShiftPayload[]) => Promise<void>;
  onDelete: (shiftId: string) => Promise<void>;
};

type ShiftFormState = {
  employeeId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  position: string;
  notes: string;
  color: string;
  repeatShift: boolean;
  repeatMode: "OKRES" | "DNI" | "WYBÓR";
  repeatRangeFrom: string;
  repeatRangeTo: string;
  repeatWeeks: string;
  repeatWeekdays: string[];
  repeatCustomDates: string[];
};

const emptyState: ShiftFormState = {
  employeeId: "",
  locationId: "",
  date: "",
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: "",
  position: "",
  notes: "",
  color: "#10b981",
  repeatShift: false,
  repeatMode: "DNI",
  repeatRangeFrom: "",
  repeatRangeTo: "",
  repeatWeeks: "4",
  repeatWeekdays: [],
  repeatCustomDates: [],
};

export function ShiftModal({
  open,
  employees,
  locations,
  availability,
  leaves,
  shift,
  initialDate,
  lockedEmployeeId = null,
  positionOptions = [],
  onClose,
  onSave,
  onSaveBulk,
  onDelete,
}: ShiftModalProps) {
  const [form, setForm] = useState<ShiftFormState>(emptyState);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (shift) {
      const start = new Date(shift.startsAt);
      const end = new Date(shift.endsAt);
      setForm({
        employeeId: shift.employeeId,
        locationId: shift.locationId ?? "",
        date: formatDateKey(start),
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        breakMinutes: extractBreakMinutes(shift.notes ?? "")?.toString() ?? "",
        position: shift.position ?? "",
        notes: shift.notes ?? "",
        color: shift.color ?? "#10b981",
        repeatShift: false,
        repeatMode: "DNI",
        repeatRangeFrom: "",
        repeatRangeTo: "",
        repeatWeeks: "4",
        repeatWeekdays: [],
        repeatCustomDates: [],
      });
      setShowAdditionalFields(false);
      setError(null);
      return;
    }
    const dateValue = initialDate ? formatDateKey(initialDate) : formatDateKey(new Date());
    const defaultEmployeeId = lockedEmployeeId ?? employees[0]?.id ?? "";
    setForm({
      ...emptyState,
      date: dateValue,
      employeeId: defaultEmployeeId,
      locationId: locations[0]?.id ?? "",
    });
    setShowAdditionalFields(false);
    setError(null);
  }, [employees, initialDate, locations, lockedEmployeeId, open, shift]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.employeeId),
    [employees, form.employeeId],
  );

  const isEmployeeLocked = Boolean(lockedEmployeeId) && !shift;

  const selectedDate = useMemo(() => new Date(`${form.date}T00:00:00`), [form.date]);
  const availabilityForEmployee = availability.filter((slot) => slot.employeeId === form.employeeId);
  const availabilityStatus = getAvailabilityStatus(
    availabilityForEmployee,
    selectedDate,
    form.startTime,
    form.endTime,
  );
  const leaveForDay = leaves.find((leave) => {
    if (leave.employeeId !== form.employeeId) return false;
    const dayKey = form.date;
    const start = leave.startDate.slice(0, 10);
    const end = leave.endDate.slice(0, 10);
    return start <= dayKey && end >= dayKey;
  });

  const shiftLengthMinutes = Math.max(0, parseTimeToMinutes(form.endTime) - parseTimeToMinutes(form.startTime));
  const shiftLengthHours = (shiftLengthMinutes / 60).toFixed(1);

  useEffect(() => {
    if (!form.repeatShift || form.repeatWeekdays.length > 0) return;
    const date = new Date(`${form.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    setForm((prev) => ({ ...prev, repeatWeekdays: [String(date.getDay())] }));
  }, [form.date, form.repeatShift, form.repeatWeekdays.length]);

  const handleChange = (field: keyof ShiftFormState, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePresetSelect = (value: string) => {
    const [start, end] = value.split("-");
    if (!start || !end) return;
    setForm((prev) => ({ ...prev, startTime: start, endTime: end }));
  };

  const buildPayloadForDate = (dateValue: string): ShiftPayload => {
    const breakMinutes = form.breakMinutes ? Number(form.breakMinutes) : null;
    const notes = mergeNotesWithBreak(form.notes, breakMinutes);
    return {
      employeeId: form.employeeId,
      locationId: form.locationId || undefined,
      position: form.position || undefined,
      notes: notes || undefined,
      color: form.color || undefined,
      startsAt: new Date(`${dateValue}T${form.startTime}:00`).toISOString(),
      endsAt: new Date(`${dateValue}T${form.endTime}:00`).toISOString(),
    };
  };

  const buildRepeatDates = () => {
    const baseDate = new Date(`${form.date}T00:00:00`);
    const selectedWeekdays =
      form.repeatWeekdays.length > 0
        ? form.repeatWeekdays.map((value) => Number(value))
        : [baseDate.getDay()];

    if (form.repeatMode === "OKRES") {
      const from = form.repeatRangeFrom || form.date;
      const to = form.repeatRangeTo || form.date;
      const startDate = new Date(`${from}T00:00:00`);
      const endDate = new Date(`${to}T00:00:00`);
      const dates: string[] = [];
      for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
        if (selectedWeekdays.includes(cursor.getDay())) {
          dates.push(formatDateKey(cursor));
        }
      }
      return dates;
    }

    if (form.repeatMode === "WYBÓR") {
      const unique = new Set([form.date, ...form.repeatCustomDates]);
      return Array.from(unique);
    }

    const weeks = Math.max(1, Number(form.repeatWeeks || 1));
    const dates: string[] = [];
    for (let week = 0; week < weeks; week += 1) {
      const weekStart = addDays(baseDate, week * 7);
      for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
        const cursor = addDays(weekStart, dayOffset);
        if (selectedWeekdays.includes(cursor.getDay())) {
          dates.push(formatDateKey(cursor));
        }
      }
    }
    return dates;
  };

  const validate = () => {
    if (!form.employeeId) return "Wybierz pracownika.";
    if (!form.date) return "Wybierz datę.";
    if (!form.startTime || !form.endTime) return "Uzupełnij godziny zmiany.";
    if (parseTimeToMinutes(form.startTime) >= parseTimeToMinutes(form.endTime)) {
      return "Godzina zakończenia musi być późniejsza niż start.";
    }
    if (leaveForDay) {
      return `Pracownik ma zatwierdzony urlop (${leaveForDay.leaveType?.name ?? "Urlop"}).`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (form.repeatShift && !shift) {
        const repeatDates = buildRepeatDates();
        const payloads = repeatDates.map((dateValue) => buildPayloadForDate(dateValue));
        await onSaveBulk(payloads);
      } else {
        const payload = buildPayloadForDate(form.date);
        await onSave(payload, shift?.id);
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nie udało się zapisać zmiany.");
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "space-y-1 text-xs font-semibold text-surface-500";
  const inputClass = "h-9 w-full rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-900";
  const selectClass = inputClass;
  const sectionTitleClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400";

  return (
    <Modal
      open={open}
      title={shift ? "Edytuj zmianę" : "Dodaj zmianę"}
      description="Uzupełnij szczegóły zmiany i sprawdź dostępność pracownika."
      onClose={onClose}
      size="lg"
      variant="light"
      containerClassName="rounded-xl"
      headerClassName="px-5 py-3"
      bodyClassName="px-5 py-4"
      footerClassName="px-5 py-3"
      footer={
        <>
          {shift && (
            <button
              type="button"
              onClick={() => shift.id && onDelete(shift.id)}
              className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              Usuń zmianę
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            disabled={saving}
          >
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-surface-700">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <p className={sectionTitleClass}>Kto i kiedy</p>
            <div className="grid gap-3">
              <label className={labelClass}>
                Pracownik
                {isEmployeeLocked ? (
                  <div className="flex min-h-[36px] items-center rounded-md border border-surface-200 bg-surface-50 px-3 py-2">
                    {selectedEmployee ? (
                      <EmployeeInline
                        employee={selectedEmployee}
                        subtitle={selectedEmployee.position ?? selectedEmployee.email ?? null}
                        size="sm"
                        nameClassName="text-sm text-surface-800"
                        subtitleClassName="text-xs text-surface-500"
                      />
                    ) : (
                      <span className="text-sm text-surface-500">Nie wybrano pracownika</span>
                    )}
                  </div>
                ) : (
                  <select
                    className={selectClass}
                    value={form.employeeId}
                    onChange={(event) => handleChange("employeeId", event.target.value)}
                  >
                    <option value="">Wybierz pracownika</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className={labelClass}>
                Data
                <input
                  type="date"
                  className={inputClass}
                  value={form.date}
                  onChange={(event) => handleChange("date", event.target.value)}
                />
              </label>

              <label className={labelClass}>
                Godzina od / do
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    className={inputClass}
                    value={form.startTime}
                    onChange={(event) => handleChange("startTime", event.target.value)}
                  />
                  <input
                    type="time"
                    className={inputClass}
                    value={form.endTime}
                    onChange={(event) => handleChange("endTime", event.target.value)}
                  />
                </div>
                <p className="text-[11px] text-surface-400">Długość: {shiftLengthHours} h</p>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-surface-600">
                <input
                  type="checkbox"
                  checked={form.repeatShift}
                  onChange={(event) => {
                    handleChange("repeatShift", event.target.checked);
                    if (event.target.checked) {
                      setShowAdditionalFields(true);
                    }
                  }}
                  className="h-4 w-4 rounded border-surface-300"
                  disabled={Boolean(shift)}
                />
                Powtórz zmianę
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <p className={sectionTitleClass}>Gdzie i co</p>
            <div className="grid gap-3">
              <label className={labelClass}>
                Lokalizacja
                <select
                  className={selectClass}
                  value={form.locationId}
                  onChange={(event) => handleChange("locationId", event.target.value)}
                >
                  <option value="">Bez lokalizacji</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Stanowisko
                <select
                  className={selectClass}
                  value={form.position}
                  onChange={(event) => handleChange("position", event.target.value)}
                >
                  <option value="">Wybierz stanowisko</option>
                  {positionOptions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Typ zmiany
                <select className={selectClass} onChange={(event) => handlePresetSelect(event.target.value)} defaultValue="">
                  <option value="">Wybierz zakres</option>
                  {TIME_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Kolor / tag
                <input
                  type="color"
                  className="h-9 w-full rounded-md border border-surface-200 bg-white px-2"
                  value={form.color}
                  onChange={(event) => handleChange("color", event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdditionalFields((prev) => !prev)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {showAdditionalFields ? "Ukryj dodatkowe pola" : "Pokaż dodatkowe pola"}
          </button>
        </div>

        {showAdditionalFields && (
          <div className="rounded-md border border-surface-200 bg-surface-50 p-3 text-sm text-surface-600">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Długość przerwy (min)
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.breakMinutes}
                  onChange={(event) => handleChange("breakMinutes", event.target.value)}
                  placeholder="np. 30"
                />
              </label>
            </div>

            {form.repeatShift && !shift && (
              <div className="mt-3 space-y-3 rounded-md border border-surface-200 bg-white p-3 text-sm text-surface-600">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">Tryb powtórzeń</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["OKRES", "DNI", "WYBÓR"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleChange("repeatMode", mode)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                        form.repeatMode === mode
                          ? "border-brand-500 bg-white text-brand-700"
                          : "border-surface-200 bg-surface-100 text-surface-500"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {(form.repeatMode === "OKRES" || form.repeatMode === "DNI") && (
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((weekday) => (
                        <button
                          key={weekday.value}
                          type="button"
                          onClick={() =>
                            handleChange(
                              "repeatWeekdays",
                              form.repeatWeekdays.includes(String(weekday.value))
                                ? form.repeatWeekdays.filter((value) => value !== String(weekday.value))
                                : [...form.repeatWeekdays, String(weekday.value)],
                            )
                          }
                          className={`rounded-md border px-2 py-1 text-[11px] ${
                            form.repeatWeekdays.includes(String(weekday.value))
                              ? "border-brand-500 bg-white text-brand-700"
                              : "border-surface-200 bg-white text-surface-500"
                          }`}
                        >
                          {weekday.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {form.repeatMode === "OKRES" && (
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="space-y-1 text-[11px] text-surface-500">
                        Od
                        <input
                          type="date"
                          value={form.repeatRangeFrom || form.date}
                          onChange={(event) => handleChange("repeatRangeFrom", event.target.value)}
                          className="h-8 w-full rounded-md border border-surface-200 bg-white px-2 text-sm"
                        />
                      </label>
                      <label className="space-y-1 text-[11px] text-surface-500">
                        Do
                        <input
                          type="date"
                          value={form.repeatRangeTo || form.date}
                          onChange={(event) => handleChange("repeatRangeTo", event.target.value)}
                          className="h-8 w-full rounded-md border border-surface-200 bg-white px-2 text-sm"
                        />
                      </label>
                    </div>
                  )}

                  {form.repeatMode === "DNI" && (
                    <label className="space-y-1 text-[11px] text-surface-500">
                      Liczba tygodni
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={form.repeatWeeks}
                        onChange={(event) => handleChange("repeatWeeks", event.target.value)}
                        className="h-8 w-full rounded-md border border-surface-200 bg-white px-2 text-sm"
                      />
                    </label>
                  )}

                  {form.repeatMode === "WYBÓR" && (
                    <div className="space-y-2">
                      <label className="space-y-1 text-[11px] text-surface-500">
                        Dodaj datę
                        <input
                          type="date"
                          value=""
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!value) return;
                            if (!form.repeatCustomDates.includes(value)) {
                              handleChange("repeatCustomDates", [...form.repeatCustomDates, value]);
                            }
                          }}
                          className="h-8 w-full rounded-md border border-surface-200 bg-white px-2 text-sm"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[form.date, ...form.repeatCustomDates].map((dateValue) => (
                          <span
                            key={dateValue}
                            className="flex items-center gap-1 rounded-md border border-surface-200 bg-white px-2 py-1 text-[11px] text-surface-600"
                          >
                            {dateValue}
                            {dateValue !== form.date && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChange(
                                    "repeatCustomDates",
                                    form.repeatCustomDates.filter((value) => value !== dateValue),
                                  )
                                }
                                className="text-surface-400 hover:text-surface-600"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <label className="mt-3 block space-y-1 text-xs font-semibold text-surface-500">
              Notatki
              <textarea
                className="min-h-[70px] w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900"
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                placeholder="Uwagi do zmiany (opcjonalnie)"
              />
            </label>

            <div className="mt-3 rounded-md border border-surface-200 bg-white px-3 py-2 text-xs text-surface-600">
              <p className="font-semibold text-surface-800">Dyspozycja pracownika</p>
              <p className="text-[11px] text-surface-400">
                {selectedEmployee
                  ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                  : "Nie wybrano pracownika"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  className={`rounded-full px-2 py-1 ${
                    availabilityStatus.status === "within"
                      ? "bg-emerald-100 text-emerald-700"
                      : availabilityStatus.status === "outside"
                        ? "bg-amber-100 text-amber-700"
                        : availabilityStatus.status === "day-off"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-surface-200 text-surface-600"
                  }`}
                >
                  {availabilityStatus.label}
                </span>
                {leaveForDay && (
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">
                    Urlop: {leaveForDay.leaveType?.name ?? leaveForDay.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
