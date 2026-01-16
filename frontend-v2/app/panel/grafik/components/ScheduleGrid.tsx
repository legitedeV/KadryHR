import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import type { AvailabilityIndicator, ShiftDisplay, WeekRange } from "../types";
import type { ApprovedLeaveForSchedule, EmployeeRecord, ScheduleMetadata, ShiftRecord } from "@/lib/api";
import { formatEmployeeName, formatMinutes, getContrastTextColor } from "../utils";

const dowOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const dowLabels = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const dowShortLabels = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"];

const REQUIRED_AFTERNOON_COUNT = 2;
const AFTERNOON_START_HOUR = 14;
const WEEK_TARGET_HOURS = 40;

interface ScheduleGridProps {
  range: WeekRange;
  employees: EmployeeRecord[];
  shifts: ShiftRecord[];
  canManage: boolean;
  gridByEmployeeAndDay: Record<string, Record<string, ShiftDisplay[]>>;
  availabilityIndicators: Record<string, Record<string, AvailabilityIndicator>>;
  approvedLeavesByEmployeeAndDay?: Record<string, Record<string, ApprovedLeaveForSchedule[]>>;
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

function availabilityCellStyles(status: AvailabilityIndicator["status"], hasApprovedLeave: boolean) {
  if (hasApprovedLeave) {
    return "bg-amber-500/10 ring-1 ring-amber-400/20";
  }
  switch (status) {
    case "available":
      return "bg-emerald-500/5";
    case "partial":
      return "bg-amber-500/10 ring-1 ring-amber-400/20";
    default:
      return "bg-rose-500/5 bg-[linear-gradient(135deg,rgba(244,63,94,0.12)_25%,transparent_25%,transparent_50%,rgba(244,63,94,0.12)_50%,rgba(244,63,94,0.12)_75%,transparent_75%,transparent)] bg-[length:10px_10px]";
  }
}

export function ScheduleGrid({
  range,
  employees,
  shifts,
  canManage,
  gridByEmployeeAndDay,
  availabilityIndicators,
  approvedLeavesByEmployeeAndDay,
  draggedShift,
  scheduleMetadata,
  promotionAfternoonCounts,
  onDragStart,
  onDropShift,
  onOpenCreate,
  onOpenEdit,
  onDeleteShift,
}: ScheduleGridProps) {
  const [activeDropTarget, setActiveDropTarget] = useState<{ employeeId: string; dayIndex: number } | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);

  const { employeeTotals, dayTotals, totalWeekMinutes } = useMemo(() => {
    const totalsByEmployee: Record<string, number> = {};
    const totalsByDay: number[] = Array.from({ length: 7 }, () => 0);
    let totalMinutes = 0;

    shifts.forEach((shift) => {
      if (!shift.employeeId) return;
      const start = new Date(shift.startsAt);
      const end = new Date(shift.endsAt);
      const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
      if (!Number.isFinite(minutes) || minutes <= 0) return;

      totalsByEmployee[shift.employeeId] = (totalsByEmployee[shift.employeeId] ?? 0) + minutes;

      const dateStr = start.toISOString().slice(0, 10);
      for (let i = 0; i < 7; i += 1) {
        const dayDate = new Date(range.from);
        dayDate.setDate(dayDate.getDate() + i);
        if (dayDate.toISOString().slice(0, 10) === dateStr) {
          totalsByDay[i] += minutes;
        }
      }

      totalMinutes += minutes;
    });

    return { employeeTotals: totalsByEmployee, dayTotals: totalsByDay, totalWeekMinutes: totalMinutes };
  }, [range.from, shifts]);

  const promotionWarnings = scheduleMetadata?.promotionDays
    ?.filter((promo) => promo.type === "ZMIANA_PROMOCJI")
    .map((promo) => {
      const count = promotionAfternoonCounts[promo.date] ?? 0;
      return { date: promo.date, count };
    })
    .filter((promo) => promo.count < REQUIRED_AFTERNOON_COUNT) ?? [];

  const [showPromotionPopup, setShowPromotionPopup] = useState(promotionWarnings.length > 0);

  useEffect(() => {
    if (promotionWarnings.length > 0) {
      setShowPromotionPopup(true);
    }
  }, [promotionWarnings.length]);

  return (
    <div className="space-y-4">
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-400">
            <span className="rounded-full border border-surface-800/60 bg-surface-900/60 px-2.5 py-1">
              Łącznie godzin: {formatMinutes(totalWeekMinutes)}
            </span>
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
          </div>
        </div>
      </div>

      {showPromotionPopup && promotionWarnings.length > 0 && (
        <div className="fixed right-6 top-24 z-40 w-[320px] rounded-2xl border border-amber-400/40 bg-surface-950/95 p-4 text-sm text-amber-100 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 rounded-full bg-amber-500/20 p-1 text-amber-200">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Zmiana promocji
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Wymagane minimum 2 osoby na popołudniowej zmianie.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPromotionPopup(false)}
              className="rounded-full border border-amber-400/30 p-1 text-amber-200/70 transition hover:text-amber-100"
              aria-label="Zamknij powiadomienie"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-amber-200/90">
            {promotionWarnings.map((warning) => (
              <li key={warning.date} className="flex items-center justify-between gap-2">
                <span className="capitalize">
                  {new Date(warning.date).toLocaleDateString("pl-PL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                  {warning.count}/{REQUIRED_AFTERNOON_COUNT}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && employees.length > 0 && shifts.length === 0 && (
        <div className="flex items-center justify-end">
          <button className="btn-primary px-4 py-2" onClick={() => onOpenCreate()}>
            Dodaj zmianę
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-surface-800/80 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.6)] -mx-1 lg:-mx-2">
        <table className="min-w-full w-full table-fixed">
          <thead className="bg-surface-900/70 sticky top-0 z-10">
            <tr className="border-b border-surface-800/80">
              <th className="w-52 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 sticky left-0 bg-surface-900/80 z-20">
                Pracownik
              </th>
              {dowLabels.map((dayLabel, idx) => {
                const dayDate = new Date(range.from);
                dayDate.setDate(dayDate.getDate() + idx);
                const dayDateStr = dayDate.toISOString().slice(0, 10);
                const isToday = dayDateStr === todayStr;

                const isDeliveryDay = scheduleMetadata?.deliveryDays?.includes(dayDateStr);
                const promotionInfo = scheduleMetadata?.promotionDays?.find((p) => p.date === dayDateStr);

                return (
                  <th
                    key={dayLabel}
                    className={`px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-400 ${
                      isToday ? "bg-brand-500/10 text-brand-200" : ""
                    }`}
                  >
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
                              : "bg-brand-500 text-white"
                          }`}
                        >
                          {promotionInfo.type === "ZMIANA_PROMOCJI" ? "ZMIANA PROMOCJI" : "MAŁA PROMOCJA"}
                        </span>
                      )}
                      <span className={`text-sm ${isToday ? "text-brand-200" : "text-surface-200"}`}>
                        {dowShortLabels[idx]}
                      </span>
                      <span className="font-normal text-[11px] text-surface-500">
                        {dayDate.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" })}
                      </span>
                      <span className="font-normal text-[9px] text-surface-500 tracking-widest">06 12 18</span>
                      {promotionInfo?.type === "ZMIANA_PROMOCJI" && (
                        <div className="mt-1 flex flex-col items-center gap-0.5 text-[9px]">
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-200 ring-1 ring-amber-400/30">
                            Wymagane 2 osoby
                          </span>
                          <span
                            className={`font-semibold ${
                              (promotionAfternoonCounts[dayDateStr] ?? 0) >= REQUIRED_AFTERNOON_COUNT
                                ? "text-emerald-300"
                                : "text-rose-300"
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
              <th className="w-40 px-3 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-400">
                Suma tyg.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800/80 bg-surface-900/60">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-surface-400">
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
                const employeeTotalMinutes = employeeTotals[employee.id] ?? 0;
                const targetMinutes = WEEK_TARGET_HOURS * 60;
                const progress = Math.min(100, Math.round((employeeTotalMinutes / targetMinutes) * 100));
                const isRowActive = activeDropTarget?.employeeId === employee.id;
                return (
                  <tr
                    key={employee.id}
                    className={`transition-colors ${isRowActive ? "bg-brand-500/5" : "hover:bg-surface-800/40"}`}
                  >
                    <td className="w-52 px-3 py-3 sticky left-0 bg-surface-900/80 z-10 border-r border-surface-800/80">
                      <div className="flex items-center gap-2">
                        <Avatar name={formatEmployeeName(employee)} src={employee.avatarUrl} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm text-surface-50 truncate">
                            {formatEmployeeName(employee)}
                          </span>
                          {employee.position && (
                            <span className="text-[10px] text-surface-400 truncate">
                              {employee.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {dowOrder.map((dow, dayIdx) => {
                      const dayShifts = employeeShifts[dow] || [];
                      const dayIndicator = employeeAvail[dow];
                      const dayLeaves = approvedLeavesByEmployeeAndDay?.[employee.id]?.[dow] || [];
                      const dayDate = new Date(range.from);
                      dayDate.setDate(dayDate.getDate() + dayIdx);
                      const dayDateValue = dayDate.toISOString().slice(0, 10);
                      const isColumnActive = activeDropTarget?.dayIndex === dayIdx;
                      const isToday = dayDateValue === todayStr;
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
                      const hasApprovedLeave = dayLeaves.length > 0;

                      const dropHandlers = canManage
                        ? {
                            onDragOver: (event: DragEvent<HTMLTableCellElement>) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                              setActiveDropTarget({ employeeId: employee.id, dayIndex: dayIdx });
                            },
                            onDragLeave: () => {
                              setActiveDropTarget((prev) =>
                                prev?.employeeId === employee.id && prev?.dayIndex === dayIdx ? null : prev,
                              );
                            },
                            onDrop: (event: DragEvent<HTMLTableCellElement>) => {
                              setActiveDropTarget(null);
                              onDropShift(event, dayDateValue, employee.id);
                            },
                          }
                        : {};

                      return (
                        <td
                          key={dow}
                          className={`px-2 py-2 align-top transition-colors ${
                            draggedShift && canManage ? "hover:bg-brand-500/10" : ""
                          } ${isColumnActive ? "bg-brand-500/10" : ""} ${isToday ? "bg-brand-500/5" : ""}`}
                          {...dropHandlers}
                        >
                            <div
                              className={`flex flex-col gap-2 min-h-[72px] rounded-2xl border border-surface-800/40 px-2 py-2 ${availabilityCellStyles(
                                dayIndicator?.status ?? "unavailable",
                                hasApprovedLeave,
                              )}`}
                            >
                              <div className="flex items-center justify-between">
                                {dayIndicator && (
                                  <div className="flex items-center gap-1 text-[9px] text-surface-400" title={availabilityTooltip}>
                                    <span className={`h-2 w-2 rounded-full ${availabilityDotColor(dayIndicator.status)}`} />
                                    <span className="sr-only">{dayAvailabilityLabel}</span>
                                  </div>
                                )}
                                {hasApprovedLeave && (
                                  <span
                                    className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-500 text-white"
                                    title={dayLeaves[0].leaveType?.name || "Urlop"}
                                  >
                                    URLOP
                                  </span>
                                )}
                              </div>
                              {dayShifts.length === 0 ? (
                                canManage ? (
                                  <button
                                    className="w-full h-full min-h-[50px] rounded-2xl border border-dashed border-surface-800/70 hover:border-brand-500/60 hover:bg-brand-500/10 transition-all flex items-center justify-center group"
                                    onClick={() => onOpenCreate(dayDateValue, employee.id)}
                                    aria-label={`Dodaj zmianę dla ${formatEmployeeName(employee)} na ${dowLabels[dayIdx]}`}
                                  >
                                    <svg className="w-4 h-4 text-surface-400 group-hover:text-brand-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-center text-[10px] text-surface-500 min-h-[50px]">
                                    Brak zmian
                                  </div>
                                )
                              ) : (
                              <>
                                {dayShifts.map((shift) => {
                                  const sourceShift = shifts.find((s) => s.id === shift.id);
                                  const showWarning = Boolean(shift.availabilityWarning || hasApprovedLeave);
                                  return (
                                    <div
                                      key={shift.id}
                                      draggable={canManage}
                                      onDragStart={(event) => {
                                        if (!canManage) return;
                                        onDragStart(shift.id, event);
                                      }}
                                      className={`group relative rounded-2xl border px-3 py-2 shadow-sm hover:shadow-lg transition-all text-xs ${
                                        shift.color
                                          ? ""
                                          : "border-emerald-500/30 bg-emerald-500/10"
                                      } ${draggedShift === shift.id ? "opacity-60 scale-95" : "hover:-translate-y-0.5"} ${
                                        canManage ? "cursor-move" : "cursor-default"
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
                                      <div className={`flex items-center justify-between gap-2 ${shift.color ? "ml-1.5" : ""}`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Avatar name={shift.employeeName} src={shift.employeeAvatar} size="sm" className="h-6 w-6 text-[10px]" />
                                          <div
                                            className="font-semibold text-[11px] min-w-0"
                                            style={
                                              shift.color
                                                ? { color: getContrastTextColor(shift.color + "30") === "#ffffff" ? shift.color : shift.color }
                                                : undefined
                                            }
                                          >
                                            <div className="flex items-center gap-1">
                                              <span className={`text-[11px] ${shift.color ? "" : "text-emerald-200"}`}>
                                                {shift.start}–{shift.end}
                                              </span>
                                              {showWarning && (
                                                <span
                                                  className="inline-flex items-center text-amber-400"
                                                  title={shift.availabilityWarning || "Konflikt z urlopem"}
                                                >
                                                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[9px] uppercase tracking-wide text-surface-400 truncate">
                                              {shift.position || shift.locationName || "Zmiana"}
                                            </div>
                                            {shift.locationName && shift.locationName !== "Brak lokalizacji" && shift.position && (
                                              <div className="text-[9px] text-surface-300 truncate">
                                                {shift.locationName}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {canManage && (
                                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              className="text-[9px] text-brand-300 hover:text-brand-200 font-medium p-0.5"
                                              onClick={() => sourceShift && onOpenEdit(sourceShift)}
                                              aria-label="Edytuj zmianę"
                                            >
                                              ✎
                                            </button>
                                            <button
                                              className="text-[9px] text-rose-300 hover:text-rose-200 font-medium p-0.5"
                                              onClick={() => sourceShift && onDeleteShift(sourceShift)}
                                              aria-label="Usuń zmianę"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {canManage && (
                                  <button
                                    className="w-full rounded-2xl border border-dashed border-surface-800/70 hover:border-brand-500/60 hover:bg-brand-500/10 transition-colors py-1 flex items-center justify-center group"
                                    onClick={() => onOpenCreate(dayDateValue, employee.id)}
                                    aria-label={`Dodaj kolejną zmianę dla ${formatEmployeeName(employee)} na ${dowLabels[dayIdx]}`}
                                  >
                                    <svg className="w-3 h-3 text-surface-400 group-hover:text-brand-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 align-top">
                      <div className="rounded-2xl border border-surface-800/70 bg-surface-900/70 px-3 py-3 text-center shadow-sm">
                        <p className="text-xs font-semibold text-surface-50">{formatMinutes(employeeTotalMinutes)}</p>
                        <p className="text-[10px] text-surface-400">Cel {WEEK_TARGET_HOURS}h</p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-surface-800/60">
                          <div
                            className="h-1.5 rounded-full bg-brand-400"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-surface-900/70">
            <tr className="border-t border-surface-800/80">
              <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 sticky left-0 bg-surface-900/80 z-20">
                Suma dnia
              </td>
              {dayTotals.map((total, index) => (
                <td key={`total-${dowOrder[index]}`} className="px-2 py-3 text-center">
                  <div className="inline-flex flex-col items-center gap-1 rounded-full border border-surface-800/70 bg-surface-900/70 px-3 py-1 text-[10px] font-semibold text-surface-200">
                    <span>{formatMinutes(total)}</span>
                    <span className="text-[9px] text-surface-400">godziny</span>
                  </div>
                </td>
              ))}
              <td className="px-3 py-3 text-center text-xs font-semibold text-surface-300">
                {formatMinutes(totalWeekMinutes)}
              </td>
            </tr>
          </tfoot>
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
