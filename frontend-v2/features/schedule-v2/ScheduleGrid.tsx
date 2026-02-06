"use client";

import { AvailabilityRecord, ApprovedLeaveRecord, EmployeeRecord, ShiftRecord } from "@/lib/api";
import { EmployeeInline } from "./EmployeeInline";
import {
  buildCellKey,
  findLeaveForDay,
  formatDayLabel,
  formatDateKey,
  formatShiftTimeRange,
  formatTime,
  formatWeekdayLabel,
  getAvailabilityStatus,
} from "./schedule-utils";

const WEEKEND_DAYS = new Set([0, 6]);

const buildStripedBackground = (color: string) =>
  `repeating-linear-gradient(135deg, ${color}1a, ${color}1a 8px, ${color}33 8px, ${color}33 16px)`;

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
  onDropShift: (shiftId: string, targetEmployeeId: string, targetDate: Date, copy: boolean) => void;
  onCellFocus: (employeeIndex: number, dayIndex: number, extend: boolean) => void;
  onOpenContextMenu: (params: {
    employee: EmployeeRecord;
    date: Date;
    shift?: ShiftRecord;
    position: { x: number; y: number };
  }) => void;
  selectedCells: Set<string>;
  focusedCell: { employeeIndex: number; dayIndex: number } | null;
  canManage: boolean;
  isPublished: boolean;
  summaryByDay?: Array<{ date: string; hours: number; cost: number }>;
  summaryCurrency?: string;
  showLoadBars?: boolean;
  showSummaryRow?: boolean;
  showWeekendHighlight?: boolean;
  exportMode?: boolean;
  editModeEnabled?: boolean;
};

export function ScheduleGrid({
  employees,
  days,
  shifts,
  leaves,
  availability,
  onAddShift,
  onEditShift,
  onDropShift,
  onCellFocus,
  onOpenContextMenu,
  selectedCells,
  focusedCell,
  canManage,
  isPublished,
  summaryByDay,
  summaryCurrency,
  showLoadBars = true,
  showSummaryRow = true,
  showWeekendHighlight = true,
  exportMode = false,
  editModeEnabled = false,
}: ScheduleGridProps) {
  const shiftsByCell = new Map<string, ShiftRecord[]>();
  shifts.forEach((shift) => {
    const dateKey = formatDateKey(new Date(shift.startsAt));
    const key = buildCellKey(shift.employeeId, dateKey);
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

  const dayStats = days.map((day) => {
    const dayKey = formatDateKey(day.date);
    const dayShifts = shifts.filter((shift) => formatDateKey(new Date(shift.startsAt)) === dayKey);
    const uniqueEmployees = new Set(dayShifts.map((shift) => shift.employeeId));
    const planned = uniqueEmployees.size;
    const recommended = Math.max(1, Math.round(employees.length * 0.7));
    const totalMinutes = dayShifts.reduce((sum, shift) => {
      const start = new Date(shift.startsAt).getTime();
      const end = new Date(shift.endsAt).getTime();
      return sum + Math.max(0, (end - start) / 60000);
    }, 0);
    return { dayKey, planned, recommended, totalMinutes };
  });

  if (!employees.length) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center text-surface-500">
        Brak aktywnych pracowników w tej lokalizacji.
      </div>
    );
  }

  const gridTemplateColumns = `240px repeat(${days.length}, minmax(150px, 1fr))`;
  const headerCellClass = exportMode
    ? "border-r border-surface-200 bg-white px-4 py-4"
    : "sticky left-0 z-20 border-r border-surface-200 bg-white px-4 py-4";
  const rowHeaderClass = exportMode
    ? "flex items-center border-r border-surface-200 bg-white px-4 py-4"
    : "sticky left-0 z-10 flex items-center border-r border-surface-200 bg-white px-4 py-4";
  const summaryHeaderClass = exportMode
    ? "border-r border-surface-200 bg-white px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400"
    : "sticky left-0 z-20 border-r border-surface-200 bg-white px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400";
  const summaryByDate = new Map(
    (summaryByDay ?? []).map((entry) => [entry.date, entry]),
  );
  const currencyFormatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: summaryCurrency ?? "PLN",
    maximumFractionDigits: 2,
  });

  return (
    <div className="rounded-lg border border-surface-200 bg-white shadow-sm" data-onboarding-target="schedule-grid">
      <div className={exportMode ? "overflow-visible" : "overflow-x-auto"}>
        <div className={exportMode ? "w-max" : "min-w-[980px]"}>
          {showLoadBars && (
            <div
              className="grid border-b border-surface-200 bg-surface-50"
              style={{ gridTemplateColumns }}
            >
              <div
                className={
                  exportMode
                    ? "border-r border-surface-200 bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400"
                    : "sticky left-0 z-20 border-r border-surface-200 bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400"
                }
              >
                Obciążenie
              </div>
              {days.map((day, index) => {
                const stats = dayStats[index];
                const ratio = Math.min(1, stats.recommended ? stats.planned / stats.recommended : 0);
                const isWeekend = WEEKEND_DAYS.has(day.date.getDay());
                return (
                  <div
                    key={day.iso}
                    className={`px-3 py-3 ${showWeekendHighlight && isWeekend ? "bg-surface-100/80" : "bg-surface-50"}`}
                  >
                    <div
                      className="h-2 rounded-sm bg-surface-200"
                      title={`Zaplanowany personel: ${stats.planned}\nZalecany personel: ${stats.recommended}`}
                    >
                      <div
                        className="h-full rounded-sm bg-brand-500"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className={`grid border-b bg-white ${
              editModeEnabled
                ? "border-amber-200/80 bg-amber-50/40"
                : "border-surface-200"
            }`}
            style={{ gridTemplateColumns }}
          >
            <div className={headerCellClass}>
              <p className="text-xs uppercase tracking-[0.18em] text-surface-400">Pracownicy</p>
            </div>
            {days.map((day) => {
              const isWeekend = WEEKEND_DAYS.has(day.date.getDay());
              return (
                <div key={day.iso} className={`px-3 py-3 ${showWeekendHighlight && isWeekend ? "bg-surface-100/80" : ""}`}>
                  <p className="text-xs uppercase tracking-[0.18em] text-surface-400">
                    {formatWeekdayLabel(day.date)}
                  </p>
                  <p className="text-sm font-semibold text-surface-800">{formatDayLabel(day.date)}</p>
                </div>
              );
            })}
          </div>

          {employees.map((employee, employeeIndex) => (
            <div
              key={employee.id}
              className="grid border-b border-surface-200"
              style={{ gridTemplateColumns }}
            >
              <div className={rowHeaderClass}>
                <EmployeeInline
                  employee={employee}
                  subtitle={employee.position ?? employee.email ?? null}
                />
              </div>
              {days.map((day, dayIndex) => {
                const dateKey = formatDateKey(day.date);
                const key = buildCellKey(employee.id, dateKey);
                const cellShifts = shiftsByCell.get(key) ?? [];
                const leave = findLeaveForDay(leaves, employee.id, day.date);
                const availabilitySlots = availabilityByEmployee.get(employee.id) ?? [];
                const isWeekend = WEEKEND_DAYS.has(day.date.getDay());
                const isSelected = selectedCells.has(key);
                const isFocused =
                  focusedCell?.employeeIndex === employeeIndex && focusedCell?.dayIndex === dayIndex;

                return (
                  <div
                    key={key}
                    className={`group relative min-h-[120px] border-r border-surface-200 px-3 py-3 ${
                      showWeekendHighlight && isWeekend ? "bg-surface-100/70" : "bg-white"
                    } ${isSelected ? "ring-2 ring-brand-400/60" : ""} ${isFocused ? "z-10 ring-2 ring-brand-500" : ""}`}
                    onMouseDown={(event) => onCellFocus(employeeIndex, dayIndex, event.shiftKey)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      if (cellShifts.length > 1) return;
                      onOpenContextMenu({
                        employee,
                        date: day.date,
                        shift: cellShifts[0],
                        position: { x: event.clientX, y: event.clientY },
                      });
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const shiftId = event.dataTransfer.getData("text/plain");
                      if (shiftId) {
                        onDropShift(shiftId, employee.id, day.date, event.altKey);
                      }
                    }}
                  >
                    {canManage && (
                      <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onAddShift(employee.id, day.date)}
                          className="rounded-md border border-surface-200 bg-white px-2 py-1 text-xs text-surface-600 transition hover:border-brand-400/60 hover:text-surface-900"
                          aria-label={`Dodaj zmianę dla ${employee.firstName} ${employee.lastName} w dniu ${dateKey}`}
                        >
                          +
                        </button>
                      </div>
                    )}

                    {leave && (
                      <div className="mb-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                        <p className="font-semibold">{leave.leaveType?.name ?? "Urlop"}</p>
                        <p className="text-[11px] text-rose-400">Nieobecność zatwierdzona</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {cellShifts.length === 0 && !leave && (
                        <p className="text-xs text-surface-400">Brak zmian</p>
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
                        const isDraft = shift.status ? shift.status === "DRAFT" : !isPublished;
                        const accentColor = shift.color ?? "#10b981";

                        return (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => {
                              if (canManage) onEditShift(shift);
                            }}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onOpenContextMenu({
                                employee,
                                date: day.date,
                                shift,
                                position: { x: event.clientX, y: event.clientY },
                              });
                            }}
                            draggable={canManage}
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/plain", shift.id);
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            className={`flex flex-col gap-1 rounded-md border border-surface-200 px-3 py-2 text-left text-xs text-surface-800 transition ${
                              canManage ? "hover:border-brand-400/60 hover:bg-surface-50" : "cursor-default"
                            }`}
                            role="button"
                            aria-disabled={!canManage}
                            tabIndex={canManage ? 0 : -1}
                            style={{
                              borderColor: accentColor,
                              background: isDraft ? buildStripedBackground(accentColor) : "#ffffff",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{timeLabel}</span>
                              {availabilityStatus.status === "outside" && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-600">
                                  Poza dysp.
                                </span>
                              )}
                              {availabilityStatus.status === "day-off" && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-600">
                                  Dzień wolny
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-surface-600">
                              {shift.position ?? "Zmiana"}
                              {shift.location?.name ? ` / ${shift.location.name}` : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {showSummaryRow && (
            <div
              className={
                exportMode
                  ? "grid border-t border-surface-200 bg-white"
                  : "grid border-t border-surface-200 bg-white sticky bottom-0"
              }
              data-onboarding-target="schedule-summary"
              style={{ gridTemplateColumns }}
            >
              <div className={summaryHeaderClass}>
                Podsumowanie
              </div>
              {days.map((day, index) => {
                const stats = dayStats[index];
                const isWeekend = WEEKEND_DAYS.has(day.date.getDay());
                const summary = summaryByDate.get(stats.dayKey);
                const hours = summary
                  ? summary.hours.toFixed(1)
                  : (stats.totalMinutes / 60).toFixed(1);
                const costLabel = summary ? currencyFormatter.format(summary.cost) : "—";
                return (
                  <div
                    key={day.iso}
                    className={`px-3 py-4 text-xs text-surface-600 ${showWeekendHighlight && isWeekend ? "bg-surface-100/80" : "bg-white"}`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-surface-800">
                      <span>👥</span>
                      <span>{stats.planned}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-surface-500">{hours} godz.</div>
                    <div className="text-[11px] text-surface-400">Koszt: {costLabel}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
