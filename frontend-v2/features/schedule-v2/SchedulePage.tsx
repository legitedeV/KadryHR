"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateScheduleShift,
  apiDeleteShift,
  apiGetApprovedLeaves,
  apiGetAvailability,
  apiGetSchedule,
  apiListEmployees,
  apiListLocations,
  apiPublishSchedule,
  apiUpdateShift,
  ApprovedLeaveRecord,
  AvailabilityRecord,
  EmployeeRecord,
  LocationRecord,
  ScheduleShiftRecord,
  ShiftPayload,
  ShiftRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { pushToast } from "@/lib/toast";
import { usePermissions } from "@/lib/use-permissions";
import { Modal } from "@/components/Modal";
import { ScheduleGrid } from "./ScheduleGrid";
import { ScheduleToolbar } from "./ScheduleToolbar";
import { ShiftModal } from "./ShiftModal";
import {
  addDays,
  formatDateKey,
  formatShortRangeLabel,
  startOfWeek,
} from "./schedule-utils";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { DateRangeModal } from "./DateRangeModal";

const PUBLISHED_STORAGE_KEY = "kadryhr:schedule-v2:published";

export function SchedulePage() {
  const { hasAnyPermission } = usePermissions();
  const { startScheduleTour, hasScheduleTourCompleted, hasScheduleTourSkipped, isReady } = useOnboarding();
  const [hasToken] = useState(() => Boolean(getAccessToken()));
  const canManage = hasAnyPermission(["SCHEDULE_MANAGE", "RCP_EDIT"]);
  const queryClient = useQueryClient();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [leaves, setLeaves] = useState<ApprovedLeaveRecord[]>([]);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));
  const [error, setError] = useState<string | null>(() =>
    getAccessToken() ? null : "Zaloguj się, aby zobaczyć grafik.",
  );

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [viewMode, setViewMode] = useState("week");
  const [positionFilter, setPositionFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [sortMode, setSortMode] = useState("custom");
  const [searchValue, setSearchValue] = useState("");

  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [initialShiftDate, setInitialShiftDate] = useState<Date | null>(null);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const [publishedWeeks, setPublishedWeeks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PUBLISHED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(publishedWeeks));
  }, [publishedWeeks]);

  useEffect(() => {
    if (!hasToken) return;
    let isMounted = true;
    Promise.all([apiListEmployees({ take: 200, skip: 0, status: "active" }), apiListLocations()])
      .then(([employeesResponse, locationsResponse]) => {
        if (!isMounted) return;
        setEmployees(employeesResponse.data);
        setLocations(locationsResponse);
      })
      .catch((errorResponse) => {
        if (!isMounted) return;
        console.error(errorResponse);
        setError("Nie udało się pobrać danych organizacji.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hasToken]);

  useEffect(() => {
    if (!hasToken) return;
    const from = formatDateKey(weekStart);
    const to = formatDateKey(weekEnd);
    Promise.all([apiGetAvailability({ from, to }), apiGetApprovedLeaves({ from, to })])
      .then(([availabilityResponse, leaveResponse]) => {
        setAvailability(availabilityResponse);
        setLeaves(leaveResponse);
        setError(null);
      })
      .catch((errorResponse) => {
        console.error(errorResponse);
        setError("Nie udało się pobrać grafiku.");
      });
  }, [hasToken, weekEnd, weekStart]);

  const scheduleQuery = useQuery({
    queryKey: ["schedule", formatDateKey(weekStart), selectedLocationId],
    queryFn: () =>
      apiGetSchedule({
        from: formatDateKey(weekStart),
        to: formatDateKey(weekEnd),
        locationIds: selectedLocationId ? [selectedLocationId] : undefined,
      }),
    enabled: hasToken,
  });

  useEffect(() => {
    if (scheduleQuery.error) {
      setError("Nie udało się pobrać grafiku.");
    }
  }, [scheduleQuery.error]);

  useEffect(() => {
    if (!isReady) return;
    if (hasScheduleTourCompleted || hasScheduleTourSkipped) return;
    const timer = setTimeout(() => startScheduleTour(), 500);
    return () => clearTimeout(timer);
  }, [hasScheduleTourCompleted, hasScheduleTourSkipped, isReady, startScheduleTour]);

  const positionOptions = useMemo(
    () =>
      Array.from(
        new Set(employees.map((employee) => employee.position).filter(Boolean) as string[]),
      ),
    [employees],
  );

  const employmentOptions = [
    "Umowa o pracę",
    "Zlecenie",
    "B2B",
    "Czas określony",
    "Praktyka",
  ];

  const visibleEmployees = useMemo(() => {
    let filtered = employees;
    if (selectedLocationId) {
      filtered = filtered.filter((employee) =>
        employee.locations?.some((location) => location.id === selectedLocationId),
      );
    }
    if (positionFilter) {
      filtered = filtered.filter((employee) => employee.position === positionFilter);
    }
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase();
      filtered = filtered.filter((employee) =>
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(term),
      );
    }
    if (sortMode === "firstName") {
      filtered = [...filtered].sort((a, b) => a.firstName.localeCompare(b.firstName));
    } else if (sortMode === "lastName") {
      filtered = [...filtered].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }
    return filtered;
  }, [employees, positionFilter, searchValue, selectedLocationId, sortMode]);

  const shifts = useMemo(() => {
    const scheduleShifts = (scheduleQuery.data ?? []) as ScheduleShiftRecord[];
    const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
    const locationMap = new Map(locations.map((location) => [location.id, location]));
    return scheduleShifts.map((shift) => ({
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
          }
        : undefined,
      location: shift.locationId
        ? {
            id: shift.locationId,
            name: locationMap.get(shift.locationId)?.name ?? undefined,
          }
        : undefined,
    }));
  }, [employees, locations, scheduleQuery.data]);

  const weekKey = formatDateKey(weekStart);
  const isPublished = publishedWeeks.includes(weekKey);

  const openShiftModal = (employeeId?: string, date?: Date) => {
    if (!canManage) return;
    if (employeeId) {
      setActiveShift(null);
      setInitialShiftDate(date ?? new Date());
      setShiftModalOpen(true);
    } else {
      setActiveShift(null);
      setInitialShiftDate(date ?? weekStart);
      setShiftModalOpen(true);
    }
  };

  const handleEditShift = (shift: ShiftRecord) => {
    if (!canManage) return;
    setActiveShift(shift);
    setShiftModalOpen(true);
  };

  const handleSaveShift = async (payload: ShiftPayload, shiftId?: string) => {
    if (shiftId) {
      const result = await apiUpdateShift(shiftId, payload);
      if (result.availabilityWarning || result.leaveWarning) {
        pushToast({
          title: "Uwaga",
          description: result.availabilityWarning ?? result.leaveWarning ?? undefined,
          variant: "warning",
        });
      }
    } else {
      await apiCreateScheduleShift({
        employeeId: payload.employeeId,
        locationId: payload.locationId,
        position: payload.position,
        note: payload.notes,
        startAt: payload.startsAt,
        endAt: payload.endsAt,
      });
      pushToast({
        title: "Dodano zmianę!",
        variant: "success",
      });
    }
    await queryClient.invalidateQueries({ queryKey: ["schedule"] });
  };

  const handleDeleteShift = async (shiftId: string) => {
    await apiDeleteShift(shiftId);
    await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    setShiftModalOpen(false);
    setActiveShift(null);
  };

  const handlePublishSchedule = async () => {
    if (!canManage) return;
    const employeeIds = Array.from(new Set(shifts.map((shift) => shift.employeeId)));
    if (!employeeIds.length) {
      pushToast({
        title: "Brak zmian",
        description: "Dodaj zmiany przed publikacją grafiku.",
        variant: "warning",
      });
      return;
    }
    const from = formatDateKey(weekStart);
    const to = formatDateKey(weekEnd);
    const result = await apiPublishSchedule({
      employeeIds,
      dateRange: { from, to },
    });
    setPublishedWeeks((prev) => Array.from(new Set([...prev, weekKey])));
    pushToast({
      title: "Grafik opublikowany",
      description: `Powiadomiono ${result.notified} pracowników.`,
      variant: "success",
    });
    setPublishModalOpen(false);
  };

  const handleSortAction = useCallback(() => {
    setSortMode((prev) => (prev === "custom" ? "lastName" : "custom"));
  }, []);

  const rangeLabel = formatShortRangeLabel(weekStart, weekEnd);

  if (loading || scheduleQuery.isLoading) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center text-surface-500">
        Ładowanie grafiku...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center text-surface-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-semibold text-surface-100">Grafik pracy</h1>
        <p className="text-sm text-surface-400">
          Układaj zmiany, sprawdzaj dyspozycje i publikuj grafik dla zespołu.
        </p>
      </div>

      <ScheduleToolbar
        rangeLabel={rangeLabel}
        viewMode={viewMode}
        locationId={selectedLocationId}
        locations={locations}
        positionFilter={positionFilter}
        positionOptions={positionOptions}
        employmentFilter={employmentFilter}
        employmentOptions={employmentOptions}
        sortMode={sortMode}
        searchValue={searchValue}
        onPrevWeek={() => setWeekStart((prev) => addDays(prev, -7))}
        onNextWeek={() => setWeekStart((prev) => addDays(prev, 7))}
        onOpenRangeModal={() => setDateRangeModalOpen(true)}
        onViewModeChange={setViewMode}
        onLocationChange={setSelectedLocationId}
        onPositionFilterChange={setPositionFilter}
        onEmploymentFilterChange={setEmploymentFilter}
        onSortModeChange={setSortMode}
        onSearchChange={setSearchValue}
        onSortAction={handleSortAction}
        onOpenOptions={() => pushToast({ title: "Opcje", description: "Panel opcji w przygotowaniu.", variant: "info" })}
      />

      <ScheduleGrid
        employees={visibleEmployees}
        days={weekDays.map((date) => ({ date, iso: formatDateKey(date) }))}
        shifts={shifts}
        leaves={leaves}
        availability={availability}
        onAddShift={(employeeId, date) => openShiftModal(employeeId, date)}
        onEditShift={handleEditShift}
        canManage={canManage}
        isPublished={isPublished}
      />

      <ShiftModal
        open={shiftModalOpen}
        employees={visibleEmployees}
        locations={locations}
        availability={availability}
        leaves={leaves}
        shift={activeShift}
        initialDate={initialShiftDate}
        positionOptions={positionOptions}
        onClose={() => {
          setShiftModalOpen(false);
          setActiveShift(null);
        }}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
      />

      <DateRangeModal
        open={dateRangeModalOpen}
        weekStart={weekStart}
        weekEnd={weekEnd}
        onClose={() => setDateRangeModalOpen(false)}
        onApply={(start, end) => {
          setWeekStart(startOfWeek(start));
          setDateRangeModalOpen(false);
        }}
      />

      <Modal
        open={publishModalOpen}
        title="Opublikuj grafik"
        description="Powiadom pracowników o opublikowaniu grafiku na wybrany tydzień."
        onClose={() => setPublishModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPublishModalOpen(false)}
              className="rounded-md border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-100"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handlePublishSchedule}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Publikuj
            </button>
          </>
        }
      >
        <p className="text-sm text-surface-600">
          Sprawdź raz jeszcze zakres i potwierdź publikację grafiku.
        </p>
      </Modal>

      <button
        type="button"
        onClick={() => setPublishModalOpen(true)}
        className="fixed right-6 top-24 z-30 flex h-32 w-10 items-center justify-center rounded-md bg-brand-500 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg"
        style={{ writingMode: "vertical-rl" }}
        data-onboarding-target="schedule-publish"
      >
        Publikuj
      </button>
    </div>
  );
}
