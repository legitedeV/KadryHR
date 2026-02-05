"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiGetApprovedLeaves,
  apiGetAvailability,
  apiGetSchedule,
  apiListEmployees,
  apiListLocations,
  ApprovedLeaveRecord,
  AvailabilityRecord,
  EmployeeRecord,
  ScheduleShiftRecord,
  ShiftRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { ScheduleGrid } from "./ScheduleGrid";
import { addDays, formatDateKey } from "./schedule-utils";

type ScheduleExportViewProps = {
  month?: string | null;
};

type MonthRange = {
  monthKey: string;
  monthLabel: string;
  start: Date;
  end: Date;
};

function resolveMonthRange(monthValue?: string | null): MonthRange {
  const fallback = new Date();
  const match = monthValue?.match(/^(\d{4})-(\d{2})$/);
  const year = match ? Number(match[1]) : fallback.getFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : fallback.getMonth();
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(start);
  return { monthKey, monthLabel, start, end };
}

export function ScheduleExportView({ month }: ScheduleExportViewProps) {
  const { monthKey, monthLabel, start, end } = useMemo(() => resolveMonthRange(month), [month]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [leaves, setLeaves] = useState<ApprovedLeaveRecord[]>([]);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));
  const [error, setError] = useState<string | null>(() =>
    getAccessToken() ? null : "Zaloguj się, aby wyeksportować grafik.",
  );

  const days = useMemo(() => {
    const daysInMonth = end.getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = addDays(start, index);
      return { date, iso: formatDateKey(date) };
    });
  }, [end, start]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "visible";
    document.body.style.overflow = "visible";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const hasToken = Boolean(getAccessToken());
    if (!hasToken) {
      return;
    }

    const from = formatDateKey(start);
    const to = formatDateKey(end);
    let cancelled = false;

    Promise.all([
      apiListEmployees({ take: 200, skip: 0, status: "active" }),
      apiListLocations(),
      apiGetSchedule({ from, to }),
      apiGetAvailability({ from, to }),
      apiGetApprovedLeaves({ from, to }),
    ])
      .then(([employeesResponse, locationsResponse, scheduleResponse, availabilityResponse, leavesResponse]) => {
        if (cancelled) return;
        setEmployees(employeesResponse.data);
        const employeeMap = new Map(employeesResponse.data.map((employee) => [employee.id, employee]));
        const locationMap = new Map(locationsResponse.map((location) => [location.id, location]));
        const scheduleShifts = (scheduleResponse ?? []) as ScheduleShiftRecord[];
        const mappedShifts = scheduleShifts.map((shift) => ({
          id: shift.id,
          employeeId: shift.employeeId,
          locationId: shift.locationId ?? null,
          position: shift.position ?? null,
          notes: shift.notes ?? shift.note ?? null,
          color: shift.color ?? null,
          startsAt: shift.startsAt,
          endsAt: shift.endsAt,
          status: shift.status ?? null,
          employee: employeeMap.get(shift.employeeId)
            ? {
                id: shift.employeeId,
                firstName: employeeMap.get(shift.employeeId)?.firstName,
                lastName: employeeMap.get(shift.employeeId)?.lastName,
                avatarUrl: employeeMap.get(shift.employeeId)?.avatarUrl ?? undefined,
                avatarUpdatedAt: employeeMap.get(shift.employeeId)?.avatarUpdatedAt ?? undefined,
              }
            : undefined,
          location: shift.locationId
            ? {
                id: shift.locationId,
                name: locationMap.get(shift.locationId)?.name ?? undefined,
              }
            : undefined,
        })) as ShiftRecord[];
        setShifts(mappedShifts);
        setAvailability(availabilityResponse ?? []);
        setLeaves(leavesResponse ?? []);
        setError(null);
      })
      .catch((errorResponse) => {
        console.error(errorResponse);
        setError("Nie udało się pobrać grafiku.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [end, start]);

  const exportReady = !loading && !error;

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 text-center text-surface-500">
        Ładowanie grafiku do eksportu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8 text-center text-surface-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8" data-export-ready={exportReady ? "true" : "false"}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-surface-400">Eksport grafiku</p>
        <h1 className="text-2xl font-semibold text-surface-900">
          Grafik — {monthLabel}
        </h1>
        <p className="text-sm text-surface-500">Zakres: {monthKey}</p>
      </div>

      <ScheduleGrid
        employees={employees}
        days={days}
        shifts={shifts}
        leaves={leaves}
        availability={availability}
        onAddShift={() => undefined}
        onEditShift={() => undefined}
        onDropShift={() => undefined}
        onCellFocus={() => undefined}
        onOpenContextMenu={() => undefined}
        selectedCells={new Set()}
        focusedCell={null}
        canManage={false}
        isPublished
        showLoadBars
        showSummaryRow
        showWeekendHighlight
        exportMode
      />
    </div>
  );
}
