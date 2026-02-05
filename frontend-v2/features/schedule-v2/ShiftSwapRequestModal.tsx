"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import type { EmployeeRecord, ShiftRecord } from "@/lib/api";

interface ShiftSwapRequestModalProps {
  open: boolean;
  shift: ShiftRecord | null;
  employees: EmployeeRecord[];
  onClose: () => void;
  onSubmit: (payload: {
    shiftId: string;
    targetEmployeeId: string;
    targetDate: string;
    note?: string;
  }) => void;
  isSubmitting?: boolean;
}

export function ShiftSwapRequestModal({
  open,
  shift,
  employees,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ShiftSwapRequestModalProps) {
  const initialDate = useMemo(
    () => (shift ? new Date(shift.startsAt).toISOString().slice(0, 10) : ""),
    [shift],
  );
  const [targetDate, setTargetDate] = useState(initialDate);
  const [note, setNote] = useState("");

  const targetOptions = useMemo(() => {
    if (!shift) return [];
    return employees.filter((employee) => employee.id !== shift.employeeId);
  }, [employees, shift]);

  const initialTargetId = useMemo(() => targetOptions[0]?.id ?? "", [targetOptions]);
  const [targetEmployeeId, setTargetEmployeeId] = useState(initialTargetId);

  const canSubmit = Boolean(shift?.id && targetEmployeeId && targetDate);

  return (
    <Modal
      open={open}
      title="Poproś o zamianę zmiany"
      description="Wybierz pracownika oraz dzień, z którym chcesz się zamienić."
      onClose={onClose}
      variant="light"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-100"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => {
              if (!shift) return;
              onSubmit({
                shiftId: shift.id,
                targetEmployeeId,
                targetDate,
                note: note.trim() || undefined,
              });
            }}
            disabled={!canSubmit || isSubmitting}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Wyślij prośbę
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-600">
          {shift ? (
            <p>
              Twoja zmiana: {new Date(shift.startsAt).toLocaleDateString("pl-PL")} ({new Date(
                shift.startsAt,
              ).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              –{new Date(shift.endsAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })})
            </p>
          ) : (
            <p>Nie wybrano zmiany.</p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">
            Docelowy pracownik
          </label>
          <select
            value={targetEmployeeId}
            onChange={(event) => setTargetEmployeeId(event.target.value)}
            className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
          >
            {targetOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">Dzień docelowy</label>
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">
            Notatka (opcjonalnie)
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
            placeholder="Dodaj komentarz dla pracownika lub menedżera..."
          />
        </div>
      </div>
    </Modal>
  );
}
