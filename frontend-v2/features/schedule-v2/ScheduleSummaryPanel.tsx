"use client";

import { EmployeeRecord, ShiftRecord } from "@/lib/api";
import { EmployeeInline } from "./EmployeeInline";
import { formatDateKey, formatDayLabel } from "./schedule-utils";

type SummaryEntry = { employeeId: string; employeeName: string; hours: number };

type ScheduleSummaryPanelProps = {
  weekDays: Date[];
  employees: EmployeeRecord[];
  shifts: ShiftRecord[];
  summary: SummaryEntry[];
};

export function ScheduleSummaryPanel({
  weekDays,
  employees,
  shifts,
  summary,
}: ScheduleSummaryPanelProps) {
  const totalHours = summary.reduce((acc, item) => acc + item.hours, 0);
  const employeeShiftCounts = new Map<string, number>();
  shifts.forEach((shift) => {
    employeeShiftCounts.set(
      shift.employeeId,
      (employeeShiftCounts.get(shift.employeeId) ?? 0) + 1,
    );
  });
  const employeesWithoutShifts = employees.filter(
    (employee) => !(employeeShiftCounts.get(employee.id) ?? 0),
  );
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  const dayCoverage = weekDays.map((day) => {
    const dayKey = formatDateKey(day);
    const dayShifts = shifts.filter(
      (shift) => formatDateKey(new Date(shift.startsAt)) === dayKey,
    );
    return { day, count: dayShifts.length };
  });

  const daysWithoutCoverage = dayCoverage.filter((day) => day.count === 0);

  return (
    <div className="panel-card p-6 space-y-5" data-onboarding-target="schedule-summary">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Podsumowanie tygodnia</p>
          <p className="text-lg font-semibold text-surface-50">
            Łącznie zaplanowano {totalHours.toFixed(1)} h
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-surface-500">Łącznie zmian</p>
          <p className="text-lg font-semibold text-surface-100">{shifts.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-surface-800/60 bg-surface-900/60 p-4">
          <p className="text-sm font-semibold text-surface-100">Godziny per pracownik</p>
          <div className="mt-3 space-y-2 max-h-[240px] overflow-auto pr-2">
            {summary.length === 0 && (
              <p className="text-xs text-surface-400">Brak danych do podsumowania.</p>
            )}
            {summary.map((entry) => {
              const employee = employeesById.get(entry.employeeId);
              return (
                <div key={entry.employeeId} className="flex items-center justify-between gap-3 text-xs text-surface-200">
                  <EmployeeInline
                    employee={employee ?? undefined}
                    name={employee ? undefined : entry.employeeName}
                    size="sm"
                    nameClassName="text-xs text-surface-200"
                    subtitleClassName="text-[11px] text-surface-400"
                  />
                  <span className="font-semibold text-surface-50">{entry.hours.toFixed(1)} h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-surface-800/60 bg-surface-900/60 p-4">
          <p className="text-sm font-semibold text-surface-100">Alerty i pokrycie</p>
          <div className="mt-3 space-y-2 text-xs text-surface-200">
            <div className="flex items-center justify-between">
              <span>Pracownicy bez zmian</span>
              <span className="font-semibold text-surface-50">
                {employeesWithoutShifts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Dni bez obsady</span>
              <span className="font-semibold text-surface-50">
                {daysWithoutCoverage.length}
              </span>
            </div>
            {daysWithoutCoverage.length > 0 && (
              <div className="mt-2 space-y-1 text-[11px] text-surface-400">
                {daysWithoutCoverage.map((day) => (
                  <p key={day.day.toISOString()}>
                    {formatDayLabel(day.day)} — brak zmian
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
