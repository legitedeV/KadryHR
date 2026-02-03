"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { addDays, formatDateKey, startOfWeek, WEEKDAY_LABELS } from "./schedule-utils";

const QUICK_LINKS = [
  { label: "Wczoraj", offsetDays: -1 },
  { label: "Dzisiaj", offsetDays: 0 },
  { label: "Jutro", offsetDays: 1 },
  { label: "Poprzedni tydzień", offsetWeek: -1 },
  { label: "Ten tydzień", offsetWeek: 0 },
  { label: "Następny tydzień", offsetWeek: 1 },
  { label: "Poprzedni miesiąc", offsetMonth: -1 },
  { label: "Ten miesiąc", offsetMonth: 0 },
  { label: "Następny miesiąc", offsetMonth: 1 },
] as const;

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(date);

const formatDayNumber = (date: Date) => new Intl.DateTimeFormat("pl-PL", { day: "numeric" }).format(date);

const buildMonthGrid = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const grid: Date[] = [];
  for (let i = 0; i < startOffset; i += 1) {
    grid.push(addDays(firstDay, i - startOffset));
  }
  for (let day = 0; day < totalDays; day += 1) {
    grid.push(new Date(year, month, day + 1));
  }
  while (grid.length % 7 !== 0) {
    grid.push(addDays(grid[grid.length - 1], 1));
  }
  return grid;
};

type DateRangeModalProps = {
  open: boolean;
  weekStart: Date;
  weekEnd: Date;
  onClose: () => void;
  onApply: (start: Date, end: Date) => void;
};

export function DateRangeModal({ open, weekStart, weekEnd, onClose, onApply }: DateRangeModalProps) {
  const [rangeStart, setRangeStart] = useState<Date>(weekStart);
  const [rangeEnd, setRangeEnd] = useState<Date>(weekEnd);
  const [baseMonth, setBaseMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRangeStart(weekStart);
    setRangeEnd(weekEnd);
    setBaseMonth(weekStart);
  }, [open, weekEnd, weekStart]);

  const monthOne = useMemo(() => new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1), [baseMonth]);
  const monthTwo = useMemo(() => new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1), [baseMonth]);
  const monthOneDays = useMemo(() => buildMonthGrid(monthOne), [monthOne]);
  const monthTwoDays = useMemo(() => buildMonthGrid(monthTwo), [monthTwo]);

  const handleDayClick = (day: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day);
      setRangeEnd(day);
      return;
    }
    if (day < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(day);
      return;
    }
    setRangeEnd(day);
  };

  const isInRange = (day: Date) => {
    const start = rangeStart ? new Date(rangeStart) : null;
    const end = rangeEnd ? new Date(rangeEnd) : null;
    if (!start || !end) return false;
    return day >= start && day <= end;
  };

  const isRangeEdge = (day: Date, edge: "start" | "end") => {
    if (!rangeStart || !rangeEnd) return false;
    const dateKey = formatDateKey(day);
    const target = edge === "start" ? rangeStart : rangeEnd;
    return formatDateKey(target) === dateKey;
  };

  const handleQuickLink = (link: (typeof QUICK_LINKS)[number]) => {
    const today = new Date();
    if (link.offsetDays !== undefined) {
      const target = addDays(today, link.offsetDays);
      setRangeStart(target);
      setRangeEnd(target);
      setBaseMonth(target);
      return;
    }
    if (link.offsetWeek !== undefined) {
      const start = addDays(startOfWeek(today), link.offsetWeek * 7);
      setRangeStart(start);
      setRangeEnd(addDays(start, 6));
      setBaseMonth(start);
      return;
    }
    if (link.offsetMonth !== undefined) {
      const base = new Date(today.getFullYear(), today.getMonth() + link.offsetMonth, 1);
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      setRangeStart(base);
      setRangeEnd(end);
      setBaseMonth(base);
    }
  };

  return (
    <Modal
      open={open}
      title="Wybierz zakres dat"
      description="Szybko wybierz tydzień lub zakres w kalendarzu."
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-surface-300 bg-surface-50 px-4 py-2 text-sm text-surface-700 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => onApply(rangeStart, rangeEnd)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Zastosuj zakres
          </button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">Szybkie skróty</p>
          <div className="mt-4 space-y-2">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleQuickLink(link)}
                className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-left text-sm text-surface-700 hover:border-surface-200 hover:bg-surface-100"
              >
                <span>{link.label}</span>
                <span className="text-xs text-surface-400">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setBaseMonth(new Date(monthOne.getFullYear(), monthOne.getMonth() - 1, 1))}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1 text-sm text-surface-600"
            >
              ←
            </button>
            <div className="text-sm text-surface-500">
              {formatDateKey(rangeStart)} → {formatDateKey(rangeEnd)}
            </div>
            <button
              type="button"
              onClick={() => setBaseMonth(new Date(monthOne.getFullYear(), monthOne.getMonth() + 1, 1))}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1 text-sm text-surface-600"
            >
              →
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[{ month: monthOne, days: monthOneDays }, { month: monthTwo, days: monthTwoDays }].map((block) => (
              <div key={block.month.toISOString()} className="rounded-lg border border-surface-200 bg-surface-50 p-4">
                <p className="text-sm font-semibold text-surface-700">{formatMonthLabel(block.month)}</p>
                <div className="mt-3 grid grid-cols-7 gap-1 text-[11px] text-surface-400">
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label} className="text-center">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {block.days.map((day) => {
                    const isCurrentMonth = day.getMonth() === block.month.getMonth();
                    const isSelected = isRangeEdge(day, "start") || isRangeEdge(day, "end");
                    return (
                      <button
                        type="button"
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={`h-9 rounded-md text-xs transition ${
                          isSelected
                            ? "bg-brand-500 text-white"
                            : isInRange(day)
                              ? "bg-brand-100 text-brand-900"
                              : "bg-transparent text-surface-600"
                        } ${isCurrentMonth ? "" : "opacity-40"}`}
                      >
                        {formatDayNumber(day)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
