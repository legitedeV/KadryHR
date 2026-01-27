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
  formatDateKey,
  getAvailabilityStatus,
  mergeNotesWithBreak,
  parseTimeToMinutes,
} from "./schedule-utils";

type ShiftModalProps = {
  open: boolean;
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  availability: AvailabilityRecord[];
  leaves: ApprovedLeaveRecord[];
  shift?: ShiftRecord | null;
  initialDate?: Date | null;
  onClose: () => void;
  onSave: (payload: ShiftPayload, shiftId?: string) => Promise<void>;
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
  color: "#C99B64",
};

export function ShiftModal({
  open,
  employees,
  locations,
  availability,
  leaves,
  shift,
  initialDate,
  onClose,
  onSave,
  onDelete,
}: ShiftModalProps) {
  const [form, setForm] = useState<ShiftFormState>(emptyState);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        color: shift.color ?? "#C99B64",
      });
      setError(null);
      return;
    }
    const dateValue = initialDate ? formatDateKey(initialDate) : formatDateKey(new Date());
    setForm({
      ...emptyState,
      date: dateValue,
      employeeId: employees[0]?.id ?? "",
      locationId: locations[0]?.id ?? "",
    });
    setError(null);
  }, [employees, initialDate, locations, open, shift]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.employeeId),
    [employees, form.employeeId],
  );

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

  const handleChange = (field: keyof ShiftFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      const breakMinutes = form.breakMinutes ? Number(form.breakMinutes) : null;
      const notes = mergeNotesWithBreak(form.notes, breakMinutes);
      const payload: ShiftPayload = {
        employeeId: form.employeeId,
        locationId: form.locationId || undefined,
        position: form.position || undefined,
        notes: notes || undefined,
        color: form.color || undefined,
        startsAt: new Date(`${form.date}T${form.startTime}:00`).toISOString(),
        endsAt: new Date(`${form.date}T${form.endTime}:00`).toISOString(),
      };
      await onSave(payload, shift?.id);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nie udało się zapisać zmiany.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={shift ? "Edytuj zmianę" : "Dodaj zmianę"}
      description="Uzupełnij szczegóły zmiany i sprawdź dostępność pracownika."
      onClose={onClose}
      footer={
        <>
          {shift && (
            <button
              type="button"
              onClick={() => shift.id && onDelete(shift.id)}
              className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
            >
              Usuń zmianę
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-surface-700/60 bg-surface-900/50 px-4 py-2 text-sm text-surface-200 hover:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-950 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            disabled={saving}
          >
            {saving ? "Zapisywanie..." : "Zapisz zmianę"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-surface-200">
          Pracownik
          <select
            className="panel-input h-11 w-full"
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
        </label>

        <label className="space-y-2 text-sm text-surface-200">
          Lokalizacja
          <select
            className="panel-input h-11 w-full"
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

        <label className="space-y-2 text-sm text-surface-200">
          Data
          <input
            type="date"
            className="panel-input h-11 w-full"
            value={form.date}
            onChange={(event) => handleChange("date", event.target.value)}
          />
        </label>

        <label className="space-y-2 text-sm text-surface-200">
          Stanowisko / tag
          <input
            type="text"
            className="panel-input h-11 w-full"
            placeholder="np. Kasa, Magazyn"
            value={form.position}
            onChange={(event) => handleChange("position", event.target.value)}
          />
        </label>

        <label className="space-y-2 text-sm text-surface-200">
          Godzina startu
          <input
            type="time"
            className="panel-input h-11 w-full"
            value={form.startTime}
            onChange={(event) => handleChange("startTime", event.target.value)}
          />
        </label>

        <label className="space-y-2 text-sm text-surface-200">
          Godzina końca
          <input
            type="time"
            className="panel-input h-11 w-full"
            value={form.endTime}
            onChange={(event) => handleChange("endTime", event.target.value)}
          />
        </label>

        <label className="space-y-2 text-sm text-surface-200">
          Długość przerwy (min)
          <input
            type="number"
            min={0}
            className="panel-input h-11 w-full"
            value={form.breakMinutes}
            onChange={(event) => handleChange("breakMinutes", event.target.value)}
            placeholder="np. 30"
          />
        </label>

        <label className="space-y-2 text-sm text-surface-200">
          Kolor zmiany
          <input
            type="color"
            className="h-11 w-full rounded-xl border border-surface-700/60 bg-surface-900/50 px-2"
            value={form.color}
            onChange={(event) => handleChange("color", event.target.value)}
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-surface-200">
        Notatki
        <textarea
          className="panel-input min-h-[90px] w-full"
          value={form.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
          placeholder="Uwagi do zmiany (opcjonalnie)"
        />
      </label>

      <div className="rounded-xl border border-surface-800/60 bg-surface-900/60 px-4 py-3 text-sm text-surface-200">
        <p className="font-semibold text-surface-100">Dyspozycja pracownika</p>
        <p className="text-xs text-surface-400">
          {selectedEmployee
            ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
            : "Nie wybrano pracownika"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-1 ${
              availabilityStatus.status === "within"
                ? "bg-emerald-500/15 text-emerald-200"
                : availabilityStatus.status === "outside"
                  ? "bg-amber-500/20 text-amber-200"
                  : availabilityStatus.status === "day-off"
                    ? "bg-rose-500/20 text-rose-200"
                    : "bg-surface-800/60 text-surface-300"
            }`}
          >
            {availabilityStatus.label}
          </span>
          {leaveForDay && (
            <span className="rounded-full bg-rose-500/20 px-2 py-1 text-rose-200">
              Urlop: {leaveForDay.leaveType?.name ?? leaveForDay.type}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
    </Modal>
  );
}
