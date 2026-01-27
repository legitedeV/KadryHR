"use client";

import { AvailabilityRecord, ApprovedLeaveRecord, EmployeeRecord, ShiftRecord } from "@/lib/api";
import {
  WEEKDAY_LABELS,
  findLeaveForDay,
  formatDayLabel,
  formatDateKey,
  formatShiftTimeRange,
  formatTime,
  getAvailabilityStatus,
} from "./schedule-utils";

type DayColumn = {
  date: Date;
  iso: string;
};

type ScheduleGridProps = {
  employees: EmployeeRecord[];
  days: DayColumn[];
  shifts: ShiftRecord[];
  leaves: ApprovedLeaveRecord[];
  availability: AvailabilityRecord[];
  onAddShift: (employeeId: string, date: Date) => void;
  onEditShift: (shift: ShiftRecord) => void;
  canManage: boolean;
};

export function ScheduleGrid({
  employees,
  days,
  shifts,
  leaves,
  availability,
  onAddShift,
  onEditShift,
  canManage,
}: ScheduleGridProps) {
  const shiftsByCell = new Map<string, ShiftRecord[]>();
  shifts.forEach((shift) => {
    const dateKey = formatDateKey(new Date(shift.startsAt));
    const key = `${shift.employeeId}-${dateKey}`;
    const current = shiftsByCell.get(key) ?? [];
    current.push(shift);
    shiftsByCell.set(key, current);
  });

  const availabilityByEmployee = new Map<string, AvailabilityRecord[]>();
  availability.forEach((slot) => {
    const current = availabilityByEmployee.get(slot.employeeId) ?? [];
    current.push(slot);
    availabilityByEmployee.set(slot.employeeId, current);
  });

  if (!employees.length) {
    return (
      <div className="panel-card p-6 text-center text-surface-400">
        Brak aktywnych pracowników w tej lokalizacji.
      </div>
    );
  }

  return (
    <div className="panel-card p-0 overflow-hidden" data-onboarding-target="schedule-grid">
      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[260px_repeat(7,minmax(160px,1fr))] border-b border-surface-800/60 bg-surface-950/40">
            <div className="sticky left-0 z-10 border-r border-surface-800/60 bg-surface-950/60 px-4 py-3 text-xs uppercase tracking-[0.2em] text-surface-500">
              Pracownicy
            </div>
            {days.map((day, index) => (
              <div key={day.iso} className="px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-surface-500">
                  {WEEKDAY_LABELS[index]}
                </p>
                <p className="text-sm font-semibold text-surface-100">{formatDayLabel(day.date)}</p>
              </div>
            ))}
          </div>

          {employees.map((employee) => (
            <div
              key={employee.id}
              className="grid grid-cols-[260px_repeat(7,minmax(160px,1fr))] border-b border-surface-900/70"
            >
              <div className="sticky left-0 z-10 flex items-center gap-3 border-r border-surface-900/70 bg-surface-950/60 px-4 py-4">
                <div className="h-9 w-9 rounded-full bg-surface-800/80" />
                <div>
                  <p className="text-sm font-semibold text-surface-50">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-surface-400">{employee.position ?? "Stanowisko"}</p>
                </div>
              </div>
              {days.map((day) => {
                const dateKey = formatDateKey(day.date);
                const key = `${employee.id}-${dateKey}`;
                const cellShifts = shiftsByCell.get(key) ?? [];
                const leave = findLeaveForDay(leaves, employee.id, day.date);
                const availabilitySlots = availabilityByEmployee.get(employee.id) ?? [];

                return (
                  <div
                    key={key}
                    className="group relative min-h-[120px] border-r border-surface-900/70 px-3 py-3"
                  >
                    {canManage && (
                      <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onAddShift(employee.id, day.date)}
                          className="rounded-lg border border-surface-700/60 bg-surface-900/60 px-2 py-1 text-xs text-surface-200 transition hover:border-brand-400/60 hover:text-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                          aria-label={`Dodaj zmianę dla ${employee.firstName} ${employee.lastName} w dniu ${dateKey}`}
                        >
                          +
                        </button>
                      </div>
                    )}

                    {leave && (
                      <div className="mb-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                        <p className="font-semibold">
                          {leave.leaveType?.name ?? "Urlop"}
                        </p>
                        <p className="text-[11px] text-rose-200/80">
                          Nieobecność zatwierdzona
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {cellShifts.length === 0 && !leave && (
                        <p className="text-xs text-surface-600">Brak zmian</p>
                      )}
                      {cellShifts.map((shift) => {
                        const timeLabel = formatShiftTimeRange(shift);
                        const startTime = formatTime(new Date(shift.startsAt));
                        const endTime = formatTime(new Date(shift.endsAt));
                        const availabilityStatus = getAvailabilityStatus(
                          availabilitySlots,
                          day.date,
                          startTime,
                          endTime,
                        );

                        return (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => onEditShift(shift)}
                            className="flex flex-col gap-1 rounded-xl border border-surface-700/60 bg-surface-900/70 px-3 py-2 text-left text-xs text-surface-100 transition hover:border-brand-400/60 hover:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                            role="button"
                            disabled={!canManage}
                            style={
                              shift.color
                                ? {
                                    borderColor: shift.color,
                                    boxShadow: `inset 3px 0 0 ${shift.color}`,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{timeLabel}</span>
                              {availabilityStatus.status === "outside" && (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                                  Poza dysp.
                                </span>
                              )}
                              {availabilityStatus.status === "day-off" && (
                                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-200">
                                  Dzień wolny
                                </span>
                              )}
                            </div>
                            {shift.position && (
                              <span className="text-[11px] text-surface-300">{shift.position}</span>
                            )}
                            {shift.location?.name && (
                              <span className="text-[11px] text-surface-500">{shift.location.name}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
