import type { DragEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import type { AvailabilityIndicator, ShiftDisplay, WeekRange } from "../types";
import type { EmployeeRecord, ScheduleMetadata, ShiftRecord } from "@/lib/api";
import { formatEmployeeName, formatMinutes, getContrastTextColor } from "../utils";

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

const REQUIRED_AFTERNOON_COUNT = 2;
const AFTERNOON_START_HOUR = 14;

interface ScheduleGridProps {
  range: WeekRange;
  employees: EmployeeRecord[];
  shifts: ShiftRecord[];
  gridByEmployeeAndDay: Record<string, Record<string, ShiftDisplay[]>>;
  availabilityIndicators: Record<string, Record<string, AvailabilityIndicator>>;
  draggedShift: string | null;
  scheduleMetadata: ScheduleMetadata | null;
  promotionAfternoonCounts: Record<string, number>;
  onDragStart: (shiftId: string, event: DragEvent<HTMLDivElement>) => void;
  onDropShift: (event: DragEvent<HTMLTableCellElement>, targetDate: string, targetEmployeeId: string) => void;
  onOpenCreate: (date?: string, employeeId?: string) => void;
  onOpenEdit: (shift: ShiftRecord) => void;
  onDeleteShift: (shift: ShiftRecord) => void;
}

function availabilityDotColor(status: AvailabilityIndicator["status"]) {
  switch (status) {
    case "available":
      return "bg-emerald-400 dark:bg-emerald-500";
    case "partial":
      return "bg-amber-400 dark:bg-amber-500";
    default:
      return "bg-rose-400 dark:bg-rose-500";
  }
}

export function ScheduleGrid({
  range,
  employees,
  shifts,
  gridByEmployeeAndDay,
  availabilityIndicators,
  draggedShift,
  scheduleMetadata,
  promotionAfternoonCounts,
  onDragStart,
  onDropShift,
  onOpenCreate,
  onOpenEdit,
  onDeleteShift,
}: ScheduleGridProps) {
  const promotionWarnings = scheduleMetadata?.promotionDays
    ?.filter((promo) => promo.type === "ZMIANA_PROMOCJI")
    .map((promo) => {
      const count = promotionAfternoonCounts[promo.date] ?? 0;
      return { date: promo.date, count };
    })
    .filter((promo) => promo.count < REQUIRED_AFTERNOON_COUNT) ?? [];

  return (
    <div className="card p-4 lg:p-5">
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
          <span className="text-xs text-surface-500 dark:text-surface-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> dostępny
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> częściowo
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> brak dostępności
            </span>
          </span>
        </div>
      </div>

      {promotionWarnings.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="space-y-1">
              <p className="font-semibold">
                ZMIANA PROMOCJI: wymagane minimum 2 osoby na popołudniowej zmianie.
              </p>
              <ul className="space-y-0.5 text-xs">
                {promotionWarnings.map((warning) => (
                  <li key={warning.date}>
                    {new Date(warning.date).toLocaleDateString("pl-PL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · obsada {warning.count}/{REQUIRED_AFTERNOON_COUNT}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {employees.length > 0 && shifts.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-200/80 bg-surface-50/40 dark:border-surface-800/80 dark:bg-surface-900/40">
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Brak zmian w tym tygodniu"
            description="Dodaj pierwszą zmianę, aby rozpocząć planowanie grafiku."
            action={
              <button className="btn-primary px-4 py-2" onClick={() => onOpenCreate()}>
                Dodaj zmianę
              </button>
            }
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80 -mx-1 lg:-mx-2">
        <table className="min-w-full w-full table-fixed">
          <thead className="bg-surface-50/80 dark:bg-surface-900/80">
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="w-48 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 sticky left-0 bg-surface-50/80 dark:bg-surface-900/80 z-10">
                Pracownik
              </th>
              {dowLabels.map((dayLabel, idx) => {
                const dayDate = new Date(range.from);
                dayDate.setDate(dayDate.getDate() + idx);
                const dayDateStr = dayDate.toISOString().slice(0, 10);

                const isDeliveryDay = scheduleMetadata?.deliveryDays?.includes(dayDateStr);
                const promotionInfo = scheduleMetadata?.promotionDays?.find((p) => p.date === dayDateStr);

                return (
                  <th key={dayLabel} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    <div className="flex flex-col items-center gap-1">
                      {isDeliveryDay && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-white">
                          DOSTAWA
                        </span>
                      )}
                      {promotionInfo && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            promotionInfo.type === "ZMIANA_PROMOCJI"
                              ? "bg-amber-500 text-white"
                              : "bg-violet-500 text-white"
                          }`}
                        >
                          {promotionInfo.type === "ZMIANA_PROMOCJI" ? "ZMIANA PROMOCJI" : "MAŁA PROMOCJA"}
                        </span>
                      )}
                      <span>{dayLabel}</span>
                      <span className="font-normal text-[10px] text-surface-400 dark:text-surface-500">
                        {dayDate.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" })}
                      </span>
                      {promotionInfo?.type === "ZMIANA_PROMOCJI" && (
                        <div className="mt-1 flex flex-col items-center gap-0.5 text-[9px]">
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60">
                            Wymagane 2 osoby
                          </span>
                          <span
                            className={`font-semibold ${
                              (promotionAfternoonCounts[dayDateStr] ?? 0) >= REQUIRED_AFTERNOON_COUNT
                                ? "text-emerald-600 dark:text-emerald-300"
                                : "text-rose-600 dark:text-rose-300"
                            }`}
                          >
                            Popołudnie: {promotionAfternoonCounts[dayDateStr] ?? 0}/{REQUIRED_AFTERNOON_COUNT}
                          </span>
                        </div>
                      )}
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
                  <EmptyState
                    icon={
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    }
                    title="Brak pracowników"
                    description="Dodaj pracowników, aby tworzyć grafik zmian."
                  />
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const employeeShifts = gridByEmployeeAndDay[employee.id] || {};
                const employeeAvail = availabilityIndicators[employee.id] || {};
                return (
                  <tr key={employee.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="w-48 px-3 py-2 sticky left-0 bg-white dark:bg-surface-900/50 z-10 border-r border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2">
                        <Avatar name={formatEmployeeName(employee)} src={employee.avatarUrl} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm text-surface-900 dark:text-surface-50 truncate">
                            {formatEmployeeName(employee)}
                          </span>
                          {employee.position && (
                            <span className="text-[10px] text-surface-500 dark:text-surface-400 truncate">
                              {employee.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {dowOrder.map((dow, dayIdx) => {
                      const dayShifts = employeeShifts[dow] || [];
                      const dayIndicator = employeeAvail[dow];
                      const dayDate = new Date(range.from);
                      dayDate.setDate(dayDate.getDate() + dayIdx);
                      const dayDateValue = dayDate.toISOString().slice(0, 10);
                      const dayAvailabilityLabel = dayIndicator
                        ? `Dostępność: ${dayIndicator.label}`
                        : "Brak danych o dostępności";
                      const availabilityTooltip = dayIndicator
                        ? dayIndicator.windows.length
                          ? `Dostępność: ${dayIndicator.windows
                              .map((avail) => `${formatMinutes(avail.startMinutes)}–${formatMinutes(avail.endMinutes)}`)
                              .join(", ")}`
                          : dayIndicator.label
                        : "Brak dostępności";

                      return (
                        <td
                          key={dow}
                          className={`px-2 py-2 align-top ${draggedShift ? "hover:bg-brand-50/50 dark:hover:bg-brand-950/30" : ""}`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(event) => onDropShift(event, dayDateValue, employee.id)}
                        >
                          <div className="flex flex-col gap-1 min-h-[50px]">
                            <div className="flex items-center justify-between">
                              {dayIndicator && (
                                <div className="flex items-center gap-1 text-[9px] text-surface-500" title={availabilityTooltip}>
                                  <span className={`h-2 w-2 rounded-full ${availabilityDotColor(dayIndicator.status)}`} />
                                  <span className="sr-only">{dayAvailabilityLabel}</span>
                                </div>
                              )}
                            </div>
                            {dayShifts.length === 0 ? (
                              <button
                                className="w-full h-full min-h-[50px] rounded-lg border border-dashed border-surface-200 hover:border-brand-300 hover:bg-brand-50/30 dark:border-surface-700 dark:hover:border-brand-700 dark:hover:bg-brand-950/20 transition-colors flex items-center justify-center group"
                                onClick={() => onOpenCreate(dayDateValue, employee.id)}
                                aria-label={`Dodaj zmianę dla ${formatEmployeeName(employee)} na ${dowLabels[dayIdx]}`}
                              >
                                <svg className="w-4 h-4 text-surface-400 group-hover:text-brand-600 dark:text-surface-500 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                                      draggable
                                      onDragStart={(event) => onDragStart(shift.id, event)}
                                      className={`group relative rounded-md border px-1.5 py-1.5 shadow-sm hover:shadow-md transition-all text-xs cursor-move ${
                                        shift.color
                                          ? ""
                                          : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/30"
                                      }`}
                                      style={
                                        shift.color
                                          ? { backgroundColor: `${shift.color}20`, borderColor: `${shift.color}50` }
                                          : undefined
                                      }
                                    >
                                      {shift.color && (
                                        <div
                                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                                          style={{ backgroundColor: shift.color }}
                                        />
                                      )}
                                      <div className={`flex items-start justify-between gap-0.5 ${shift.color ? "ml-1.5" : ""}`}>
                                        <div className="flex-1 min-w-0">
                                          <div
                                            className="font-semibold text-[11px]"
                                            style={
                                              shift.color
                                                ? { color: getContrastTextColor(shift.color + "30") === "#ffffff" ? shift.color : shift.color }
                                                : undefined
                                            }
                                          >
                                            <span className={shift.color ? "" : "text-emerald-800 dark:text-emerald-200"}>
                                              {shift.start}–{shift.end}
                                            </span>
                                          </div>
                                          {shift.locationName && shift.locationName !== "Brak lokalizacji" && (
                                            <div className="text-[9px] text-surface-600 dark:text-surface-300 truncate">
                                              {shift.locationName}
                                            </div>
                                          )}
                                          {shift.position && (
                                            <div className="text-[9px] uppercase tracking-wide text-surface-500 dark:text-surface-400 truncate">
                                              {shift.position}
                                            </div>
                                          )}
                                          {shift.availabilityWarning && (
                                            <div className="mt-0.5 rounded bg-amber-50 px-1 py-0.5 text-[8px] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:ring-amber-800/70">
                                              {shift.availabilityWarning}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            className="text-[9px] text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium p-0.5"
                                            onClick={() => sourceShift && onOpenEdit(sourceShift)}
                                            aria-label="Edytuj zmianę"
                                          >
                                            ✎
                                          </button>
                                          <button
                                            className="text-[9px] text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium p-0.5"
                                            onClick={() => sourceShift && onDeleteShift(sourceShift)}
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
                                  className="w-full rounded-md border border-dashed border-surface-200 hover:border-brand-300 hover:bg-brand-50/30 dark:border-surface-700 dark:hover:border-brand-700 dark:hover:bg-brand-950/20 transition-colors py-1 flex items-center justify-center group"
                                  onClick={() => onOpenCreate(dayDateValue, employee.id)}
                                  aria-label={`Dodaj kolejną zmianę dla ${formatEmployeeName(employee)} na ${dowLabels[dayIdx]}`}
                                >
                                  <svg className="w-3 h-3 text-surface-400 group-hover:text-brand-600 dark:text-surface-500 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  );
}

export function countAfternoonPromotions(shifts: ShiftRecord[], scheduleMetadata: ScheduleMetadata | null) {
  const counts: Record<string, number> = {};
  if (!scheduleMetadata?.promotionDays?.length) return counts;
  const promoDates = new Set(
    scheduleMetadata.promotionDays
      .filter((promo) => promo.type === "ZMIANA_PROMOCJI")
      .map((promo) => promo.date),
  );

  shifts.forEach((shift) => {
    if (!shift.employeeId) return;
    const start = new Date(shift.startsAt);
    const dateStr = start.toISOString().slice(0, 10);
    if (!promoDates.has(dateStr)) return;
    if (start.getHours() < AFTERNOON_START_HOUR) return;
    counts[dateStr] = (counts[dateStr] ?? 0) + 1;
  });

  return counts;
}
