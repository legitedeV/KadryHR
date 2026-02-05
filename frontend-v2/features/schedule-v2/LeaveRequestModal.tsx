"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import type { EmployeeRecord, LeaveCategory } from "@/lib/api";

const leaveTypeOptions: Array<{ value: LeaveCategory; label: string }> = [
  { value: "PAID_LEAVE", label: "Urlop płatny" },
  { value: "SICK", label: "Zwolnienie lekarskie" },
  { value: "UNPAID", label: "Urlop bezpłatny" },
  { value: "OTHER", label: "Inne" },
];

interface LeaveRequestModalProps {
  open: boolean;
  employee: EmployeeRecord | null;
  date: Date | null;
  onClose: () => void;
  onSubmit: (payload: {
    employeeId: string;
    type: LeaveCategory;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => void;
  isSubmitting?: boolean;
}

export function LeaveRequestModal({
  open,
  employee,
  date,
  onClose,
  onSubmit,
  isSubmitting = false,
}: LeaveRequestModalProps) {
  const initialDate = useMemo(() => (date ? date.toISOString().slice(0, 10) : ""), [date]);
  const [type, setType] = useState<LeaveCategory>("PAID_LEAVE");
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [reason, setReason] = useState("");

  const canSubmit = Boolean(employee?.id && startDate && endDate);

  return (
    <Modal
      open={open}
      title="Dodaj urlop"
      description="Dodaj wniosek urlopowy dla wybranego pracownika."
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
              if (!employee) return;
              onSubmit({
                employeeId: employee.id,
                type,
                startDate,
                endDate,
                reason: reason.trim() || undefined,
              });
            }}
            disabled={!canSubmit || isSubmitting}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Zapisz
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-600">
          {employee ? (
            <p>
              {employee.firstName} {employee.lastName}
            </p>
          ) : (
            <p>Nie wybrano pracownika.</p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">
            Typ urlopu
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as LeaveCategory)}
            className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
          >
            {leaveTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">Od</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">Do</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">
            Notatka (opcjonalnie)
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700"
            placeholder="Dodaj informację dla menedżera..."
          />
        </div>
      </div>
    </Modal>
  );
}
