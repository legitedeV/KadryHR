import type { AvailabilityRecord, ApprovedLeaveRecord, ShiftRecord } from "@/lib/api";

export const WEEKDAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"] as const;
const weekdayMap: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - (day - 1));
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function formatDateKey(date: Date) {
  return date.toLocaleDateString("sv-SE");
}

export function formatWeekLabel(from: Date, to: Date) {
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  const dayFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" });
  const fullFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });

  return sameMonth
    ? `${dayFormatter.format(from)}–${dayFormatter.format(to)} ${monthFormatter.format(to)}`
    : `${fullFormatter.format(from)} – ${fullFormatter.format(to)}`;
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(date);
}

export function formatShortRangeLabel(from: Date, to: Date) {
  const formatter = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" });
  return `${formatter.format(from)} - ${formatter.format(to)}`;
}

export function parseTimeToMinutes(value: string) {
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function buildShiftPayloadDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function extractBreakMinutes(notes?: string | null) {
  if (!notes) return null;
  const match = notes.match(/przerwa:\s*(\d+)\s*min/i);
  return match ? Number(match[1]) : null;
}

export function mergeNotesWithBreak(notes: string, breakMinutes?: number | null) {
  const cleaned = notes.replace(/przerwa:\s*\d+\s*min/gi, "").trim();
  if (!breakMinutes) return cleaned;
  const prefix = cleaned ? `${cleaned}\n` : "";
  return `${prefix}Przerwa: ${breakMinutes} min`;
}

export function getAvailabilityStatus(
  availability: AvailabilityRecord[],
  date: Date,
  startTime: string,
  endTime: string,
) {
  if (!availability.length) {
    return { status: "unknown" as const, label: "Brak deklaracji" };
  }

  const dateKey = formatDateKey(date);
  const weekday = weekdayMap[date.getDay()];
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  const relevant = availability.filter((slot) => {
    if (slot.date) {
      return slot.date.slice(0, 10) === dateKey;
    }
    if (slot.weekday) {
      return slot.weekday === weekday;
    }
    return false;
  });

  if (!relevant.length) {
    return { status: "unknown" as const, label: "Brak deklaracji" };
  }

  const hasDayOff = relevant.some((slot) => slot.status === "DAY_OFF");
  if (hasDayOff) {
    return { status: "day-off" as const, label: "Dzień wolny" };
  }

  const covered = relevant.some(
    (slot) => slot.startMinutes <= startMinutes && slot.endMinutes >= endMinutes,
  );

  if (!covered) {
    return { status: "outside" as const, label: "Poza dyspozycją" };
  }

  return { status: "within" as const, label: "W dyspozycji" };
}

export function findLeaveForDay(
  leaves: ApprovedLeaveRecord[],
  employeeId: string,
  date: Date,
) {
  const dateKey = formatDateKey(date);
  return leaves.find((leave) => {
    if (leave.employeeId !== employeeId) return false;
    const start = leave.startDate.slice(0, 10);
    const end = leave.endDate.slice(0, 10);
    return start <= dateKey && end >= dateKey;
  });
}

export function buildShiftMap(shifts: ShiftRecord[]) {
  const map = new Map<string, ShiftRecord[]>();
  shifts.forEach((shift) => {
    const keyDate = formatDateKey(new Date(shift.startsAt));
    const key = `${shift.employeeId}-${keyDate}`;
    const current = map.get(key) ?? [];
    current.push(shift);
    map.set(key, current);
  });
  return map;
}

export function formatShiftTimeRange(shift: ShiftRecord) {
  const start = new Date(shift.startsAt);
  const end = new Date(shift.endsAt);
  const formatter = new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
