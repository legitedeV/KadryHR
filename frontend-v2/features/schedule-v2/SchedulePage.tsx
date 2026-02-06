"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateScheduleShiftsBulk,
  apiCreateScheduleShift,
  apiCreateLeaveRequest,
  apiUpdateLeaveRequestStatus,
  apiCreateShiftSwapRequest,
  apiDeleteScheduleShiftsBulk,
  apiDeleteShift,
  apiGetApprovedLeaves,
  apiGetAvailability,
  apiGetSchedule,
  apiGetScheduleSummary,
  apiListEmployees,
  apiListLocations,
  apiPublishSchedule,
  apiUpdateShift,
  ApprovedLeaveRecord,
  AvailabilityRecord,
  EmployeeRecord,
  LocationRecord,
  ScheduleShiftPayload,
  ScheduleShiftRecord,
  ShiftPayload,
  ShiftRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { pushToast } from "@/lib/toast";
import { usePermissions } from "@/lib/use-permissions";
import { useTopbarActions } from "@/lib/topbar-actions-context";
import { Modal } from "@/components/Modal";
import { ScheduleGrid } from "./ScheduleGrid";
import { ScheduleToolbar } from "./ScheduleToolbar";
import { ShiftModal } from "./ShiftModal";
import { OptionsDrawer } from "./OptionsDrawer";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { ShiftSwapRequestModal } from "./ShiftSwapRequestModal";
import { ScheduleContextMenu } from "./ScheduleContextMenu";
import { getScheduleContextMenuOptions } from "./context-menu";
import {
  addDays,
  buildCellKey,
  formatDateKey,
  formatShortRangeLabel,
  startOfWeek,
} from "./schedule-utils";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { DateRangeModal } from "./DateRangeModal";
import { useAuth } from "@/lib/auth-context";
import { ScheduleCostSummaryBar } from "./ScheduleCostSummaryBar";
import { usePathname } from "next/navigation";

const PUBLISHED_STORAGE_KEY = "kadryhr:schedule-v2:published";
const EDIT_MODE_HOLD_MS = 1000;
const EDIT_MODE_TIMEOUT_MS = 120000;

export function SchedulePage() {
  const { hasAnyPermission } = usePermissions();
  const { user } = useAuth();
  const pathname = usePathname();
  const { startScheduleTour, hasScheduleTourCompleted, hasScheduleTourSkipped, isReady } = useOnboarding();
  const { setActionsSlot } = useTopbarActions();
  const [hasToken] = useState(() => Boolean(getAccessToken()));
  const canManage = hasAnyPermission(["SCHEDULE_MANAGE", "RCP_EDIT"]);
  const canEnableEditMode = user?.role === "MANAGER" || user?.role === "ADMIN";
  const canViewCosts = user?.role === "OWNER" || user?.role === "MANAGER";
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
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ employeeIndex: number; dayIndex: number } | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{ employeeIndex: number; dayIndex: number } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [timeBuffer, setTimeBuffer] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [contextMenuState, setContextMenuState] = useState<{
    employee: EmployeeRecord;
    date: Date;
    shift?: ShiftRecord;
    position: { x: number; y: number };
  } | null>(null);
  const [leaveModalState, setLeaveModalState] = useState<{
    employee: EmployeeRecord;
    date: Date;
  } | null>(null);
  const [swapModalShift, setSwapModalShift] = useState<ShiftRecord | null>(null);
  const [confirmDeleteShift, setConfirmDeleteShift] = useState<ShiftRecord | null>(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [swapSubmitting, setSwapSubmitting] = useState(false);

  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [initialShiftDate, setInitialShiftDate] = useState<Date | null>(null);
  const [lockedEmployeeId, setLockedEmployeeId] = useState<string | null>(null);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false);

  const [showLoadBars, setShowLoadBars] = useState(true);
  const [showSummaryRow, setShowSummaryRow] = useState(true);
  const [showWeekendHighlight, setShowWeekendHighlight] = useState(true);
  const [showEmployeesWithoutShifts, setShowEmployeesWithoutShifts] = useState(true);
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [editModeHoldActive, setEditModeHoldActive] = useState(false);
  const editModeHoldTimerRef = useRef<number | null>(null);
  const editModeInactivityTimerRef = useRef<number | null>(null);
  const editModeLastActivityRef = useRef<number>(Date.now());

  const [publishedWeeks, setPublishedWeeks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PUBLISHED_STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string");
      }
    } catch {
      // ignore parse errors, reset below
    }
    localStorage.removeItem(PUBLISHED_STORAGE_KEY);
    return [];
  });

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const currentEmployeeId = useMemo(() => {
    if (!user?.email) return null;
    const match = employees.find(
      (employee) => employee.email?.toLowerCase() === user.email.toLowerCase(),
    );
    return match?.id ?? null;
  }, [employees, user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(publishedWeeks));
  }, [publishedWeeks]);

  const getLastRequestId = useCallback(() => {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem("kadryhr:last-request-id") ?? undefined;
  }, []);

  const logEditModeEvent = useCallback(
    (status: "edit_mode_enabled" | "edit_mode_disabled", requestId?: string) => {
      console.info(status, {
        route: pathname,
        requestId,
      });
    },
    [pathname],
  );

  const clearEditModeInactivityTimer = useCallback(() => {
    if (editModeInactivityTimerRef.current) {
      window.clearTimeout(editModeInactivityTimerRef.current);
      editModeInactivityTimerRef.current = null;
    }
  }, []);

  const clearEditModeHoldTimer = useCallback(() => {
    if (editModeHoldTimerRef.current) {
      window.clearTimeout(editModeHoldTimerRef.current);
      editModeHoldTimerRef.current = null;
    }
    setEditModeHoldActive(false);
  }, []);

  const scheduleEditModeTimeout = useCallback(() => {
    clearEditModeInactivityTimer();
    editModeInactivityTimerRef.current = window.setTimeout(() => {
      if (!editModeEnabled) return;
      disableEditMode();
      pushToast({
        title: "Tryb edycji wyłączony (brak aktywności)",
        variant: "warning",
      });
    }, EDIT_MODE_TIMEOUT_MS);
  }, [clearEditModeInactivityTimer, disableEditMode, editModeEnabled]);

  const markEditModeActivity = useCallback(() => {
    editModeLastActivityRef.current = Date.now();
    scheduleEditModeTimeout();
  }, [scheduleEditModeTimeout]);

  const enableEditMode = useCallback(() => {
    if (!canEnableEditMode) return;
    editModeLastActivityRef.current = Date.now();
    setEditModeEnabled(true);
    setEditModeHoldActive(false);
    scheduleEditModeTimeout();
    logEditModeEvent("edit_mode_enabled", getLastRequestId());
  }, [canEnableEditMode, getLastRequestId, logEditModeEvent, scheduleEditModeTimeout]);

  const disableEditMode = useCallback(
    (requestId?: string) => {
      setEditModeEnabled(false);
      setEditModeHoldActive(false);
      clearEditModeInactivityTimer();
      clearEditModeHoldTimer();
      logEditModeEvent("edit_mode_disabled", requestId ?? getLastRequestId());
    },
    [clearEditModeHoldTimer, clearEditModeInactivityTimer, getLastRequestId, logEditModeEvent],
  );

  useEffect(() => {
    if (editModeEnabled) {
      scheduleEditModeTimeout();
    } else {
      clearEditModeInactivityTimer();
    }
  }, [clearEditModeInactivityTimer, editModeEnabled, scheduleEditModeTimeout]);

  useEffect(() => {
    if (!editModeEnabled) return;
    if (canEnableEditMode) return;
    disableEditMode();
  }, [canEnableEditMode, disableEditMode, editModeEnabled]);

  useEffect(() => {
    if (!editModeEnabled) return;
    if (pathname.startsWith("/panel/grafik")) return;
    disableEditMode();
  }, [disableEditMode, editModeEnabled, pathname]);

  useEffect(() => {
    if (!editModeEnabled) return;
    const handleUnauthorized = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId?: string }>).detail;
      disableEditMode(detail?.requestId);
    };
    window.addEventListener("kadryhr:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("kadryhr:unauthorized", handleUnauthorized);
  }, [disableEditMode, editModeEnabled]);

  const refreshAvailabilityAndLeaves = useCallback(async () => {
    const from = formatDateKey(weekStart);
    const to = formatDateKey(weekEnd);
    const [availabilityResponse, leaveResponse] = await Promise.all([
      apiGetAvailability({ from, to }),
      apiGetApprovedLeaves({ from, to }),
    ]);
    setAvailability(availabilityResponse);
    setLeaves(leaveResponse);
    setError(null);
  }, [weekEnd, weekStart]);

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
    refreshAvailabilityAndLeaves().catch((errorResponse) => {
      console.error(errorResponse);
      setError("Nie udało się pobrać grafiku.");
    });
  }, [hasToken, refreshAvailabilityAndLeaves]);

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

  const summaryQuery = useQuery({
    queryKey: ["schedule-summary", formatDateKey(weekStart), selectedLocationId],
    queryFn: () =>
      apiGetScheduleSummary({
        from: formatDateKey(weekStart),
        to: formatDateKey(weekEnd),
        locationIds: selectedLocationId ? [selectedLocationId] : undefined,
      }),
    enabled: hasToken && canViewCosts,
  });

  useEffect(() => {
    if (scheduleQuery.error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Nie udało się pobrać grafiku.");
    }
  }, [scheduleQuery.error]);

  const updateScheduleCache = useCallback(
    (updater: (current: ScheduleShiftRecord[]) => ScheduleShiftRecord[]) => {
      queryClient.setQueryData<ScheduleShiftRecord[]>(
        ["schedule", formatDateKey(weekStart), selectedLocationId],
        (current) => (current ? updater(current) : current),
      );
    },
    [queryClient, selectedLocationId, weekStart],
  );

  const bulkCreateMutation = useMutation({
    mutationFn: apiCreateScheduleShiftsBulk,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["schedule"] });
      const optimisticRecords = payload.shifts.map((shift, index) => ({
        id: `optimistic-${Date.now()}-${index}`,
        employeeId: shift.employeeId,
        locationId: shift.locationId ?? null,
        position: shift.position ?? null,
        note: shift.note ?? null,
        startsAt: shift.startAt,
        endsAt: shift.endAt,
        status: "DRAFT",
        color: null,
      })) as ScheduleShiftRecord[];
      updateScheduleCache((current) => [...current, ...optimisticRecords]);
      return { optimisticIds: optimisticRecords.map((record) => record.id) };
    },
    onError: (_error, _payload, context) => {
      if (!context?.optimisticIds) return;
      updateScheduleCache((current) => current.filter((shift) => !context.optimisticIds.includes(shift.id)));
      pushToast({ title: "Nie udało się dodać zmian", variant: "error" });
    },
    onSuccess: (result, _payload, context) => {
      if (context?.optimisticIds) {
        updateScheduleCache((current) => current.filter((shift) => !context.optimisticIds.includes(shift.id)));
      }
      updateScheduleCache((current) => [...current, ...result]);
      if (editModeEnabled) {
        markEditModeActivity();
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: apiDeleteScheduleShiftsBulk,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["schedule"] });
      const previous = queryClient.getQueryData<ScheduleShiftRecord[]>([
        "schedule",
        formatDateKey(weekStart),
        selectedLocationId,
      ]);
      updateScheduleCache((current) => current.filter((shift) => !payload.shiftIds.includes(shift.id)));
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["schedule", formatDateKey(weekStart), selectedLocationId],
          context.previous,
        );
      }
      pushToast({ title: "Nie udało się usunąć zmian", variant: "error" });
    },
    onSuccess: () => {
      if (editModeEnabled) {
        markEditModeActivity();
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

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

  const keyboardDisabled = !selectedLocationId;
  const gridHasSelection = Boolean(focusedCell) || selectedCells.size > 0;

  useEffect(() => {
    if (!keyboardDisabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKeyboardMode(false);
  }, [keyboardDisabled]);

  useEffect(() => {
    if (!gridHasSelection) {
      clearEditModeHoldTimer();
    }
  }, [clearEditModeHoldTimer, gridHasSelection]);

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
            avatarUpdatedAt: employeeMap.get(shift.employeeId)?.avatarUpdatedAt ?? undefined,
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


  const getCellKey = useCallback(
    (employeeIndex: number, dayIndex: number) => {
      const employee = visibleEmployees[employeeIndex];
      const day = weekDays[dayIndex];
      if (!employee || !day) return null;
      return buildCellKey(employee.id, formatDateKey(day));
    },
    [visibleEmployees, weekDays],
  );

  const updateSelectionFromFocus = useCallback(
    (nextFocus: { employeeIndex: number; dayIndex: number }, extend: boolean) => {
      setFocusedCell(nextFocus);
      if (!extend) {
        const nextKey = getCellKey(nextFocus.employeeIndex, nextFocus.dayIndex);
        if (nextKey) {
          setSelectedCells(new Set([nextKey]));
          setSelectionAnchor(nextFocus);
        }
        return;
      }
      const anchor = selectionAnchor ?? nextFocus;
      const startRow = Math.min(anchor.employeeIndex, nextFocus.employeeIndex);
      const endRow = Math.max(anchor.employeeIndex, nextFocus.employeeIndex);
      const startCol = Math.min(anchor.dayIndex, nextFocus.dayIndex);
      const endCol = Math.max(anchor.dayIndex, nextFocus.dayIndex);
      const nextSelected = new Set<string>();
      for (let row = startRow; row <= endRow; row += 1) {
        for (let col = startCol; col <= endCol; col += 1) {
          const key = getCellKey(row, col);
          if (key) nextSelected.add(key);
        }
      }
      setSelectedCells(nextSelected);
      setSelectionAnchor(anchor);
    },
    [getCellKey, selectionAnchor],
  );

  const weekKey = formatDateKey(weekStart);
  const isPublished = publishedWeeks.includes(weekKey);

  useEffect(() => {
    if (!keyboardMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      const withMeta = event.metaKey || event.ctrlKey;
      if (event.code === "Space") {
        event.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (!focusedCell) return;

      if (withMeta && event.key.toLowerCase() === "c") {
        event.preventDefault();
        const copied = shifts
          .filter((shift) =>
            selectedCells.has(buildCellKey(shift.employeeId, formatDateKey(new Date(shift.startsAt)))),
          )
          .map((shift) => {
            const dayIndex = weekDays.findIndex(
              (day) => formatDateKey(day) === formatDateKey(new Date(shift.startsAt)),
            );
            const employeeIndex = visibleEmployees.findIndex((emp) => emp.id === shift.employeeId);
            return { shift, dayIndex, employeeIndex };
          })
          .filter((entry) => entry.dayIndex >= 0 && entry.employeeIndex >= 0);
        if (copied.length === 0) {
          pushToast({ title: "Brak zmian do skopiowania", variant: "warning" });
          return;
        }
        const anchor = copied[0];
        (window as Window & { __scheduleClipboard?: typeof copied }).__scheduleClipboard = copied.map((entry) => ({
          shift: entry.shift,
          offsetDay: entry.dayIndex - anchor.dayIndex,
          offsetEmployee: entry.employeeIndex - anchor.employeeIndex,
        }));
        pushToast({ title: "Skopiowano zaznaczone", variant: "success" });
        return;
      }

      if (withMeta && event.key.toLowerCase() === "v") {
        event.preventDefault();
        const clipboard = (window as Window & { __scheduleClipboard?: Array<{ shift: ShiftRecord; offsetDay: number; offsetEmployee: number }> })
          .__scheduleClipboard;
        if (!clipboard?.length) {
          pushToast({ title: "Schowek jest pusty", variant: "warning" });
          return;
        }
        const payloads: ScheduleShiftPayload[] = clipboard
          .map((entry) => {
            const targetEmployee = visibleEmployees[focusedCell.employeeIndex + entry.offsetEmployee];
            const targetDay = weekDays[focusedCell.dayIndex + entry.offsetDay];
            if (!targetEmployee || !targetDay) return null;
            const start = new Date(entry.shift.startsAt);
            const end = new Date(entry.shift.endsAt);
            const startDate = new Date(targetDay);
            startDate.setHours(start.getHours(), start.getMinutes(), 0, 0);
            const endDate = new Date(targetDay);
            endDate.setHours(end.getHours(), end.getMinutes(), 0, 0);
            return {
              employeeId: targetEmployee.id,
              locationId: entry.shift.locationId ?? undefined,
              position: entry.shift.position ?? undefined,
              note: entry.shift.notes ?? undefined,
              startAt: startDate.toISOString(),
              endAt: endDate.toISOString(),
            };
          })
          .filter(Boolean) as ScheduleShiftPayload[];
        if (payloads.length) {
          bulkCreateMutation.mutate({ shifts: payloads });
          pushToast({ title: "Wklejono zmiany", variant: "success" });
        }
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setPendingDelete(true);
        pushToast({
          title: "Usuń zaznaczone?",
          description: "Naciśnij Enter, aby potwierdzić usunięcie zmian.",
          variant: "warning",
        });
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (pendingDelete) {
          const shiftIds = shifts
            .filter((shift) =>
              selectedCells.has(buildCellKey(shift.employeeId, formatDateKey(new Date(shift.startsAt)))),
            )
            .map((shift) => shift.id);
          if (shiftIds.length) {
            bulkDeleteMutation.mutate({ shiftIds });
            pushToast({ title: "Usunięto zmiany", variant: "success" });
          }
          setPendingDelete(false);
          return;
        }
        if (timeBuffer.includes("-")) {
          const [startTime, endTime] = timeBuffer.split("-");
          const payloads: ScheduleShiftPayload[] = Array.from(selectedCells)
            .map((key) => {
              const [employeeId, dateKey] = key.split("::");
              const start = new Date(`${dateKey}T${startTime}:00`);
              const end = new Date(`${dateKey}T${endTime}:00`);
              if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
              return {
                employeeId,
                startAt: start.toISOString(),
                endAt: end.toISOString(),
              };
            })
            .filter(Boolean)
            .map((payload) => ({
              ...payload,
              locationId: selectedLocationId || undefined,
              position: undefined,
              note: undefined,
            })) as ScheduleShiftPayload[];
          if (payloads.length) {
            bulkCreateMutation.mutate({ shifts: payloads });
            pushToast({ title: "Dodano zmiany", variant: "success" });
          }
          setTimeBuffer("");
        }
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const delta = {
          ArrowUp: { row: -1, col: 0 },
          ArrowDown: { row: 1, col: 0 },
          ArrowLeft: { row: 0, col: -1 },
          ArrowRight: { row: 0, col: 1 },
        }[event.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"];
        const nextRow = Math.max(0, Math.min(visibleEmployees.length - 1, focusedCell.employeeIndex + delta.row));
        const nextCol = Math.max(0, Math.min(weekDays.length - 1, focusedCell.dayIndex + delta.col));
        updateSelectionFromFocus({ employeeIndex: nextRow, dayIndex: nextCol }, event.shiftKey);
        return;
      }

      if (/^[0-9:\-]$/.test(event.key)) {
        event.preventDefault();
        setTimeBuffer((prev) => `${prev}${event.key}`.slice(0, 11));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    bulkCreateMutation,
    bulkDeleteMutation,
    focusedCell,
    keyboardMode,
    pendingDelete,
    selectedCells,
    selectedLocationId,
    shifts,
    timeBuffer,
    updateSelectionFromFocus,
    visibleEmployees,
    weekDays,
  ]);

  useEffect(() => {
    if (!keyboardMode) return;
    if (!focusedCell && visibleEmployees.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      updateSelectionFromFocus({ employeeIndex: 0, dayIndex: 0 }, false);
    }
  }, [focusedCell, keyboardMode, updateSelectionFromFocus, visibleEmployees.length]);

  useEffect(() => {
    if (!timeBuffer) return;
    const timer = window.setTimeout(() => setTimeBuffer(""), 1800);
    return () => window.clearTimeout(timer);
  }, [timeBuffer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!gridHasSelection) return;
      if (!canEnableEditMode) return;

      if (event.code === "Escape" && editModeHoldActive) {
        clearEditModeHoldTimer();
        return;
      }

      if (event.code !== "KeyE") return;
      if (event.repeat) return;
      event.preventDefault();

      if (editModeEnabled) {
        disableEditMode();
        return;
      }

      setEditModeHoldActive(true);
      editModeHoldTimerRef.current = window.setTimeout(() => {
        enableEditMode();
        setEditModeHoldActive(false);
      }, EDIT_MODE_HOLD_MS);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "KeyE") return;
      clearEditModeHoldTimer();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    canEnableEditMode,
    clearEditModeHoldTimer,
    disableEditMode,
    editModeEnabled,
    editModeHoldActive,
    enableEditMode,
    gridHasSelection,
  ]);

  // Set topbar actions
  useEffect(() => {
    setActionsSlot(
      <>
        {canManage && (
          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            data-onboarding-target="schedule-publish"
          >
            Publikuj
          </button>
        )}
        <button
          type="button"
          onClick={() => setKeyboardMode((prev) => !prev)}
          disabled={keyboardDisabled}
          title={keyboardDisabled ? "Wybierz jedną lokalizację, aby włączyć tryb klawiatury." : ""}
          className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm font-semibold transition-colors ${
            keyboardMode ? "border-brand-500 bg-white text-brand-700" : "border-surface-200 bg-white text-surface-600"
          } ${keyboardDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-surface-50"}`}
        >
          <span className="text-xs">{keyboardMode ? "◉" : "○"}</span>
          Tryb klawiatury
        </button>
      </>
    );

    return () => setActionsSlot(null);
  }, [canManage, keyboardMode, keyboardDisabled, setActionsSlot]);

  const openShiftModal = (employeeId?: string, date?: Date) => {
    if (!canManage) return;
    if (employeeId) {
      setActiveShift(null);
      setLockedEmployeeId(employeeId);
      setInitialShiftDate(date ?? new Date());
      setShiftModalOpen(true);
    } else {
      setActiveShift(null);
      setLockedEmployeeId(null);
      setInitialShiftDate(date ?? weekStart);
      setShiftModalOpen(true);
    }
  };

  const handleEditShift = (shift: ShiftRecord) => {
    if (!canManage) return;
    setActiveShift(shift);
    setLockedEmployeeId(null);
    setShiftModalOpen(true);
  };

  const contextMenuOptions = useMemo(() => {
    if (!contextMenuState) return [];
    const hasShift = Boolean(contextMenuState.shift);
    const isOwnShift = contextMenuState.shift?.employeeId === currentEmployeeId;
    return getScheduleContextMenuOptions({
      canManage,
      hasShift,
      isOwnShift: Boolean(isOwnShift),
    });
  }, [canManage, contextMenuState, currentEmployeeId]);

  const handleOpenContextMenu = useCallback(
    (params: {
      employee: EmployeeRecord;
      date: Date;
      shift?: ShiftRecord;
      position: { x: number; y: number };
    }) => {
      const hasShift = Boolean(params.shift);
      const isOwnShift = params.shift?.employeeId === currentEmployeeId;
      const options = getScheduleContextMenuOptions({
        canManage,
        hasShift,
        isOwnShift: Boolean(isOwnShift),
      });
      if (!options.length) return;
      setContextMenuState(params);
    },
    [canManage, currentEmployeeId],
  );

  const handleMarkDayOff = useCallback(
    async (employee: EmployeeRecord, date: Date) => {
      const dateKey = formatDateKey(date);
      try {
        const created = await apiCreateLeaveRequest({
          employeeId: employee.id,
          type: "OTHER",
          startDate: dateKey,
          endDate: dateKey,
          reason: "Dzień wolny",
        });
        await apiUpdateLeaveRequestStatus(created.id, "APPROVED");
        await refreshAvailabilityAndLeaves();
        await queryClient.invalidateQueries({ queryKey: ["schedule"] });
        pushToast({ title: "Oznaczono dzień wolny", variant: "success" });
      } catch (error) {
        console.error(error);
        pushToast({ title: "Nie udało się oznaczyć dnia wolnego", variant: "error" });
      }
    },
    [queryClient, refreshAvailabilityAndLeaves],
  );

  const handleContextMenuSelect = useCallback(
    (actionId: ReturnType<typeof getScheduleContextMenuOptions>[number]["id"]) => {
      if (!contextMenuState) return;
      const { employee, date, shift } = contextMenuState;
      setContextMenuState(null);

      switch (actionId) {
        case "add-shift":
          openShiftModal(employee.id, date);
          break;
        case "add-leave":
          setLeaveModalState({ employee, date });
          break;
        case "mark-day-off":
          void handleMarkDayOff(employee, date);
          break;
        case "edit-shift":
          if (shift) handleEditShift(shift);
          break;
        case "delete-shift":
          if (shift) setConfirmDeleteShift(shift);
          break;
        case "request-swap":
          if (shift) setSwapModalShift(shift);
          break;
        default:
          break;
      }
    },
    [contextMenuState, handleEditShift, handleMarkDayOff, openShiftModal],
  );

  const hasOverlap = useCallback(
    (employeeId: string, start: Date, end: Date, excludeId?: string) =>
      shifts.some((shift) => {
        if (shift.employeeId !== employeeId) return false;
        if (excludeId && shift.id === excludeId) return false;
        const existingStart = new Date(shift.startsAt);
        const existingEnd = new Date(shift.endsAt);
        return start < existingEnd && end > existingStart;
      }),
    [shifts],
  );

  const handleDropShift = async (shiftId: string, targetEmployeeId: string, targetDate: Date, copy: boolean) => {
    const sourceShift = shifts.find((shift) => shift.id === shiftId);
    if (!sourceShift) return;
    const originalStart = new Date(sourceShift.startsAt);
    const originalEnd = new Date(sourceShift.endsAt);
    const duration = originalEnd.getTime() - originalStart.getTime();
    const nextStart = new Date(targetDate);
    nextStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    const nextEnd = new Date(nextStart.getTime() + duration);

    if (hasOverlap(targetEmployeeId, nextStart, nextEnd, copy ? undefined : shiftId)) {
      pushToast({ title: "Konflikt zmian", description: "Zmiany nachodzą na siebie.", variant: "warning" });
      return;
    }

    if (copy) {
      await apiCreateScheduleShift({
        employeeId: targetEmployeeId,
        locationId: sourceShift.locationId ?? undefined,
        position: sourceShift.position ?? undefined,
        note: sourceShift.notes ?? undefined,
        startAt: nextStart.toISOString(),
        endAt: nextEnd.toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      pushToast({ title: "Skopiowano zmianę", variant: "success" });
      if (editModeEnabled) {
        markEditModeActivity();
      }
      return;
    }

    await apiUpdateShift(shiftId, {
      employeeId: targetEmployeeId,
      locationId: sourceShift.locationId ?? undefined,
      position: sourceShift.position ?? undefined,
      notes: sourceShift.notes ?? undefined,
      color: sourceShift.color ?? undefined,
      startsAt: nextStart.toISOString(),
      endsAt: nextEnd.toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["schedule"] });
    pushToast({ title: "Przeniesiono zmianę", variant: "success" });
    if (editModeEnabled) {
      markEditModeActivity();
    }
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
    if (editModeEnabled) {
      markEditModeActivity();
    }
  };

  const handleSaveBulk = async (payloads: ShiftPayload[]) => {
    if (!payloads.length) return;
    await bulkCreateMutation.mutateAsync({
      shifts: payloads.map((payload) => ({
        employeeId: payload.employeeId,
        locationId: payload.locationId,
        position: payload.position,
        note: payload.notes,
        startAt: payload.startsAt,
        endAt: payload.endsAt,
      })),
    });
    pushToast({ title: "Dodano serię zmian", variant: "success" });
    if (editModeEnabled) {
      markEditModeActivity();
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await apiDeleteShift(shiftId);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      setShiftModalOpen(false);
      setActiveShift(null);
      setLockedEmployeeId(null);
      pushToast({ title: "Usunięto zmianę", variant: "success" });
      if (editModeEnabled) {
        markEditModeActivity();
      }
    } catch (error) {
      console.error(error);
      pushToast({ title: "Nie udało się usunąć zmiany", variant: "error" });
    }
  };

  const handleConfirmDeleteShift = async () => {
    if (!confirmDeleteShift) return;
    try {
      await apiDeleteShift(confirmDeleteShift.id);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      pushToast({ title: "Usunięto zmianę", variant: "success" });
      setConfirmDeleteShift(null);
      if (editModeEnabled) {
        markEditModeActivity();
      }
    } catch (error) {
      console.error(error);
      pushToast({ title: "Nie udało się usunąć zmiany", variant: "error" });
    }
  };

  const handleCreateLeaveRequest = async (payload: {
    employeeId: string;
    type: "PAID_LEAVE" | "SICK" | "UNPAID" | "OTHER";
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    setLeaveSubmitting(true);
    try {
      const created = await apiCreateLeaveRequest(payload);
      await apiUpdateLeaveRequestStatus(created.id, "APPROVED");
      await refreshAvailabilityAndLeaves();
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      pushToast({ title: "Dodano urlop", variant: "success" });
      setLeaveModalState(null);
    } catch (error) {
      console.error(error);
      pushToast({ title: "Nie udało się dodać urlopu", variant: "error" });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCreateSwapRequest = async (payload: {
    shiftId: string;
    targetEmployeeId: string;
    targetDate: string;
    note?: string;
  }) => {
    setSwapSubmitting(true);
    try {
      await apiCreateShiftSwapRequest(payload);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      pushToast({ title: "Wysłano prośbę o zamianę", variant: "success" });
      setSwapModalShift(null);
    } catch (error) {
      console.error(error);
      pushToast({ title: "Nie udało się wysłać prośby o zamianę", variant: "error" });
    } finally {
      setSwapSubmitting(false);
    }
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

  const handleCellFocus = (employeeIndex: number, dayIndex: number, extend: boolean) => {
    updateSelectionFromFocus({ employeeIndex, dayIndex }, extend);
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[clamp(1.4rem,1.1vw+1rem,2rem)] font-semibold text-surface-900">Grafik pracy</h1>
          {editModeEnabled && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              TRYB EDYCJI
            </span>
          )}
        </div>
        <p className="text-sm text-surface-600">
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
        timeBuffer={timeBuffer}
        editModeEnabled={editModeEnabled}
        editModeHoldActive={editModeHoldActive}
        editModeDisabled={!canEnableEditMode}
        onToggleEditMode={() => {
          if (!canEnableEditMode) return;
          if (editModeEnabled) {
            disableEditMode();
          } else {
            enableEditMode();
          }
        }}
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
        onOpenOptions={() => setOptionsDrawerOpen(true)}
      />

      <ScheduleGrid
        employees={visibleEmployees}
        days={weekDays.map((date) => ({ date, iso: formatDateKey(date) }))}
        shifts={shifts}
        leaves={leaves}
        availability={availability}
        onAddShift={(employeeId, date) => openShiftModal(employeeId, date)}
        onEditShift={handleEditShift}
        onDropShift={handleDropShift}
        onCellFocus={handleCellFocus}
        onOpenContextMenu={handleOpenContextMenu}
        selectedCells={selectedCells}
        focusedCell={focusedCell}
        canManage={canManage}
        isPublished={isPublished}
        summaryByDay={summaryQuery.data?.byDay}
        summaryCurrency={summaryQuery.data?.totals?.currency}
        showLoadBars={showLoadBars}
        showSummaryRow={showSummaryRow}
        showWeekendHighlight={showWeekendHighlight}
        editModeEnabled={editModeEnabled}
      />

      <ScheduleContextMenu
        open={Boolean(contextMenuState)}
        position={contextMenuState?.position ?? null}
        options={contextMenuOptions}
        onClose={() => setContextMenuState(null)}
        onSelect={handleContextMenuSelect}
      />

      {canViewCosts && (
        <ScheduleCostSummaryBar
          summary={summaryQuery.data ?? null}
          isLoading={summaryQuery.isLoading}
        />
      )}

      {keyboardMode && showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/30 backdrop-blur-sm">
          <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-surface-800">Skróty klawiaturowe</h3>
            <ul className="mt-3 space-y-2 text-sm text-surface-600">
              <li>↑ ↓ ← → — nawigacja po komórkach</li>
              <li>Shift + strzałki — zaznaczanie zakresu</li>
              <li>Wpisz “HH:MM-HH:MM” + Enter — dodaj zmianę</li>
              <li>Ctrl/Cmd + C / V — kopiuj / wklej</li>
              <li>Backspace + Enter — usuń zaznaczone</li>
            </ul>
          </div>
        </div>
      )}

      <ShiftModal
        open={shiftModalOpen}
        employees={visibleEmployees}
        locations={locations}
        availability={availability}
        leaves={leaves}
        shift={activeShift}
        initialDate={initialShiftDate}
        lockedEmployeeId={lockedEmployeeId}
        positionOptions={positionOptions}
        onClose={() => {
          setShiftModalOpen(false);
          setActiveShift(null);
          setLockedEmployeeId(null);
        }}
        onSave={handleSaveShift}
        onSaveBulk={handleSaveBulk}
        onDelete={handleDeleteShift}
      />

      <LeaveRequestModal
        key={
          leaveModalState
            ? `${leaveModalState.employee.id}-${leaveModalState.date.toISOString()}`
            : "leave-modal"
        }
        open={Boolean(leaveModalState)}
        employee={leaveModalState?.employee ?? null}
        date={leaveModalState?.date ?? null}
        isSubmitting={leaveSubmitting}
        onClose={() => setLeaveModalState(null)}
        onSubmit={handleCreateLeaveRequest}
      />

      <ShiftSwapRequestModal
        key={swapModalShift?.id ?? "swap-modal"}
        open={Boolean(swapModalShift)}
        shift={swapModalShift}
        employees={visibleEmployees}
        isSubmitting={swapSubmitting}
        onClose={() => setSwapModalShift(null)}
        onSubmit={handleCreateSwapRequest}
      />

      <Modal
        open={Boolean(confirmDeleteShift)}
        title="Usuń zmianę"
        description="Czy na pewno chcesz usunąć tę zmianę?"
        onClose={() => setConfirmDeleteShift(null)}
        variant="light"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDeleteShift(null)}
              className="rounded-md border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-100"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteShift}
              className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Usuń zmianę
            </button>
          </>
        }
      >
        {confirmDeleteShift && (
          <p className="text-sm text-surface-600">
            {new Date(confirmDeleteShift.startsAt).toLocaleDateString("pl-PL")} •{" "}
            {new Date(confirmDeleteShift.startsAt).toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            –{" "}
            {new Date(confirmDeleteShift.endsAt).toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </Modal>

      <DateRangeModal
        open={dateRangeModalOpen}
        weekStart={weekStart}
        weekEnd={weekEnd}
        onClose={() => setDateRangeModalOpen(false)}
        onApply={(start) => {
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

      <OptionsDrawer
        open={optionsDrawerOpen}
        showLoadBars={showLoadBars}
        showSummaryRow={showSummaryRow}
        showWeekendHighlight={showWeekendHighlight}
        showEmployeesWithoutShifts={showEmployeesWithoutShifts}
        onClose={() => setOptionsDrawerOpen(false)}
        onShowLoadBarsChange={setShowLoadBars}
        onShowSummaryRowChange={setShowSummaryRow}
        onShowWeekendHighlightChange={setShowWeekendHighlight}
        onShowEmployeesWithoutShiftsChange={setShowEmployeesWithoutShifts}
      />
    </div>
  );
}
