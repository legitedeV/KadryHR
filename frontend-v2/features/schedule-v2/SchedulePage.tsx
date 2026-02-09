"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiApproveGrafikPeriod,
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
  apiListOrgEmployees,
  apiListEmployees,
  apiListLocations,
  apiPublishGrafikPeriod,
  apiUnpublishGrafikPeriod,
  apiUpdateOrgEmployeeOrder,
  apiUpdateShift,
  ApprovedLeaveRecord,
  AvailabilityRecord,
  EmployeeRecord,
  LocationRecord,
  SchedulePeriodStatus,
  ScheduleShiftPayload,
  ScheduleShiftRecord,
  ShiftPayload,
  ShiftRecord,
} from "@/lib/api";
import { ApiError } from "@/lib/api-client";
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
  buildGridCellId,
  formatDateKey,
  formatShortRangeLabel,
  startOfWeek,
} from "./schedule-utils";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { DateRangeModal } from "./DateRangeModal";
import { useAuth } from "@/lib/auth-context";
import { ScheduleCostSummaryBar } from "./ScheduleCostSummaryBar";
import { usePathname, useRouter } from "next/navigation";

const EDIT_MODE_HOLD_MS = 1000;
const DEFAULT_EDIT_MODE_TIMEOUT_MS = 120000;
const EDIT_MODE_TIMEOUT_MS = (() => {
  if (process.env.NEXT_PUBLIC_E2E === "true") {
    if (typeof window !== "undefined") {
      const runtimeOverride = Number(
        (window as Window & { __scheduleEditModeTimeoutMs?: number }).__scheduleEditModeTimeoutMs,
      );
      if (Number.isFinite(runtimeOverride) && runtimeOverride > 0) {
        return runtimeOverride;
      }
    }
    const override = Number(process.env.NEXT_PUBLIC_GRAFIK_EDIT_MODE_TIMEOUT_MS);
    if (Number.isFinite(override) && override > 0) {
      return override;
    }
  }
  return DEFAULT_EDIT_MODE_TIMEOUT_MS;
})();

const STATUS_LABELS: Record<SchedulePeriodStatus, string> = {
  DRAFT: "Roboczy",
  APPROVED: "Zatwierdzony",
  PUBLISHED: "Opublikowany",
};

export function SchedulePage() {
  const { hasAnyPermission } = usePermissions();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { startScheduleTour, hasScheduleTourCompleted, hasScheduleTourSkipped, isReady } = useOnboarding();
  const { setActionsSlot } = useTopbarActions();
  const hasToken = Boolean(getAccessToken());
  const canManage = hasAnyPermission(["SCHEDULE_MANAGE", "RCP_EDIT"]);
  const canEnableEditMode = user?.role === "MANAGER" || user?.role === "ADMIN";
  const canViewCosts = user?.role === "OWNER" || user?.role === "MANAGER";
  const queryClient = useQueryClient();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [leaves, setLeaves] = useState<ApprovedLeaveRecord[]>([]);
  const [loading, setLoading] = useState(() => hasToken);
  const [error, setError] = useState<string | null>(() =>
    hasToken ? null : "Zaloguj się, aby zobaczyć grafik.",
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
  const [contextMenuState, setContextMenuState] = useState<{
    employee: EmployeeRecord;
    date: Date;
    shift?: ShiftRecord;
    position: { x: number; y: number };
  } | null>(null);
  const [rowMenuState, setRowMenuState] = useState<{
    employeeId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [leaveModalState, setLeaveModalState] = useState<{
    employee: EmployeeRecord;
    date: Date;
  } | null>(null);
  const [swapModalShift, setSwapModalShift] = useState<ShiftRecord | null>(null);
  const [confirmDeleteShift, setConfirmDeleteShift] = useState<ShiftRecord | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeletePayloads, setBulkDeletePayloads] = useState<ScheduleShiftPayload[]>([]);
  const [bulkDeleteShiftIds, setBulkDeleteShiftIds] = useState<string[]>([]);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [skipDeleteConfirmChecked, setSkipDeleteConfirmChecked] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [swapSubmitting, setSwapSubmitting] = useState(false);

  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [initialShiftDate, setInitialShiftDate] = useState<Date | null>(null);
  const [lockedEmployeeId, setLockedEmployeeId] = useState<string | null>(null);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [lifecyclePending, setLifecyclePending] = useState(false);
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
  const [draggedEmployeeId, setDraggedEmployeeId] = useState<string | null>(null);
  const [dragOverEmployeeId, setDragOverEmployeeId] = useState<string | null>(null);
  const undoStackRef = useRef<
    Array<{ type: "create" | "delete"; payloads: ScheduleShiftPayload[]; createdIds: string[] }>
  >([]);
  const redoStackRef = useRef<
    Array<{ type: "create" | "delete"; payloads: ScheduleShiftPayload[]; createdIds: string[] }>
  >([]);
  const gridRootRef = useRef<HTMLDivElement | null>(null);
  const gridActiveRef = useRef(false);
  const [gridActive, setGridActive] = useState(false);


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

  const logDeleteFailure = useCallback(() => {
    console.warn("schedule_delete_failed", {
      route: pathname,
      requestId: getLastRequestId(),
    });
  }, [getLastRequestId, pathname]);

  const logHotkeyAction = useCallback(
    (action: string) => {
      console.info("[grafik-hotkeys]", {
        action,
        route: pathname,
        requestId: getLastRequestId(),
      });
    },
    [getLastRequestId, pathname],
  );

  const isTypingTarget = useCallback((target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
  }, []);

  const isGridActive = useCallback(() => {
    if (typeof document === "undefined") return false;
    const root = gridRootRef.current;
    if (!root) return false;
    const activeElement = document.activeElement;
    if (!activeElement || !(activeElement instanceof HTMLElement)) return false;
    if (activeElement === root) return true;
    if (!root.contains(activeElement)) return false;
    return !isTypingTarget(activeElement);
  }, [isTypingTarget]);

  const setGridActiveState = useCallback((next: boolean) => {
    gridActiveRef.current = next;
    setGridActive(next);
  }, []);

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

  if (process.env.NODE_ENV !== "production" && typeof clearEditModeHoldTimer !== "function") {
    throw new Error("[grafik] edit mode hold timer handler missing");
  }

  const handleGridFocusCapture = useCallback(() => {
    setGridActiveState(true);
  }, [setGridActiveState]);

  const handleGridBlurCapture = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (nextTarget && gridRootRef.current?.contains(nextTarget)) return;
      setGridActiveState(false);
      clearEditModeHoldTimer();
    },
    [clearEditModeHoldTimer, setGridActiveState],
  );

  const handleGridPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (isTypingTarget(event.target)) return;
      gridRootRef.current?.focus();
    },
    [isTypingTarget],
  );

  const setSessionSkipDeleteConfirm = useCallback((value: boolean) => {
    setSkipDeleteConfirm(value);
    if (typeof window === "undefined") return;
    (window as Window & { __scheduleSkipDeleteConfirm?: boolean }).__scheduleSkipDeleteConfirm = value;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = (window as Window & { __scheduleSkipDeleteConfirm?: boolean }).__scheduleSkipDeleteConfirm;
    if (flag) {
      setSkipDeleteConfirm(true);
    }
  }, []);

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

  const handleReadonlyError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        const code = (error.data as { code?: string } | null)?.code;
        if (code === "PERIOD_READONLY") {
          pushToast({
            title: "Grafik opublikowany",
            description: "Grafik opublikowany — odblokuj, aby edytować.",
            variant: "warning",
          });
          if (editModeEnabled) {
            disableEditMode();
          }
          return true;
        }
      }
      return false;
    },
    [disableEditMode, editModeEnabled],
  );

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
    const handleUnauthorized = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId?: string }>).detail;
      console.info("[grafik] unauthorized", {
        route: pathname,
        requestId: detail?.requestId,
        statusCode: 401,
      });
      disableEditMode(detail?.requestId);
      setError("Sesja wygasła — zaloguj się ponownie.");
      setLoading(false);
      pushToast({
        title: "Sesja wygasła — zaloguj się ponownie",
        variant: "warning",
      });
      router.replace("/login");
    };
    window.addEventListener("kadryhr:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("kadryhr:unauthorized", handleUnauthorized);
  }, [disableEditMode, pathname, router]);

  useEffect(() => {
    if (authLoading) return;
    if (hasToken) return;
    setError("Zaloguj się, aby zobaczyć grafik.");
    setLoading(false);
    router.replace("/login");
  }, [authLoading, hasToken, router]);

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
    const employeesRequest = canEnableEditMode
      ? apiListOrgEmployees()
      : apiListEmployees({ take: 200, skip: 0, status: "active" });
    Promise.all([employeesRequest, apiListLocations()])
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
  }, [canEnableEditMode, hasToken]);

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

  const schedulePeriod = scheduleQuery.data?.period ?? null;
  const isPublished = schedulePeriod?.status === "PUBLISHED";
  const periodId = schedulePeriod?.id ?? null;

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
      setError("Nie udało się pobrać grafiku.");
    }
  }, [scheduleQuery.error]);

  useEffect(() => {
    if (isPublished && editModeEnabled) {
      disableEditMode();
    }
  }, [disableEditMode, editModeEnabled, isPublished]);

  const updateScheduleCache = useCallback(
    (updater: (current: ScheduleShiftRecord[]) => ScheduleShiftRecord[]) => {
      queryClient.setQueryData(
        ["schedule", formatDateKey(weekStart), selectedLocationId],
        (current) => {
          if (!current) return current;
          if (Array.isArray(current)) {
            return updater(current);
          }
          return {
            ...current,
            shifts: updater((current as { shifts?: ScheduleShiftRecord[] }).shifts ?? []),
          };
        },
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
    onError: (error, _payload, context) => {
      if (!context?.optimisticIds) return;
      updateScheduleCache((current) => current.filter((shift) => !context.optimisticIds.includes(shift.id)));
      if (handleReadonlyError(error)) {
        return;
      }
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
      const previous = queryClient.getQueryData([
        "schedule",
        formatDateKey(weekStart),
        selectedLocationId,
      ]);
      updateScheduleCache((current) => current.filter((shift) => !payload.shiftIds.includes(shift.id)));
      return { previous };
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["schedule", formatDateKey(weekStart), selectedLocationId],
          context.previous,
        );
      }
      if (handleReadonlyError(error)) {
        return;
      }
      logDeleteFailure();
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
  const orderingEnabled = editModeEnabled && canEnableEditMode && sortMode === "custom" && !isPublished;

  const persistEmployeeOrder = useCallback(
    async (nextEmployees: EmployeeRecord[], previousEmployees: EmployeeRecord[]) => {
      try {
        await apiUpdateOrgEmployeeOrder(
          nextEmployees.map((employee) => employee.id),
          periodId ?? undefined,
        );
      } catch (error) {
        if (handleReadonlyError(error)) {
          setEmployees(previousEmployees);
          return;
        }
        console.warn("employee_order_update_failed", {
          route: pathname,
          requestId: getLastRequestId(),
        });
        setEmployees(previousEmployees);
        pushToast({
          title: "Nie udało się zapisać kolejności",
          variant: "error",
        });
      }
    },
    [getLastRequestId, handleReadonlyError, pathname, periodId],
  );

  const reorderEmployeesById = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;
      setEmployees((current) => {
        const previous = [...current];
        const sourceIndex = previous.findIndex((employee) => employee.id === sourceId);
        const targetIndex = previous.findIndex((employee) => employee.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) return current;
        const nextEmployees = [...previous];
        const [removed] = nextEmployees.splice(sourceIndex, 1);
        nextEmployees.splice(targetIndex, 0, removed);
        void persistEmployeeOrder(nextEmployees, previous);
        return nextEmployees;
      });
    },
    [persistEmployeeOrder],
  );

  const moveEmployeeByOffset = useCallback(
    (employeeId: string, offset: number) => {
      setEmployees((current) => {
        const previous = [...current];
        const index = previous.findIndex((employee) => employee.id === employeeId);
        if (index < 0) return current;
        const nextIndex = Math.max(0, Math.min(previous.length - 1, index + offset));
        if (index === nextIndex) return current;
        const nextEmployees = [...previous];
        const [removed] = nextEmployees.splice(index, 1);
        nextEmployees.splice(nextIndex, 0, removed);
        void persistEmployeeOrder(nextEmployees, previous);
        return nextEmployees;
      });
    },
    [persistEmployeeOrder],
  );

  const openRowMenu = useCallback((employeeId: string, position: { x: number; y: number }) => {
    setRowMenuState({ employeeId, position });
  }, []);

  useEffect(() => {
    if (!keyboardDisabled) return;
    setKeyboardMode(false);
  }, [keyboardDisabled]);

  useEffect(() => {
    if (!gridActive) {
      clearEditModeHoldTimer();
    }
  }, [clearEditModeHoldTimer, gridActive]);

  const shifts = useMemo(() => {
    const scheduleShifts = (scheduleQuery.data?.shifts ?? []) as ScheduleShiftRecord[];
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

  const selectedShifts = useMemo(
    () =>
      shifts.filter((shift) =>
        selectedCells.has(buildCellKey(shift.employeeId, formatDateKey(new Date(shift.startsAt)))),
      ),
    [selectedCells, shifts],
  );


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

  const buildShiftPayload = useCallback((shift: ShiftRecord): ScheduleShiftPayload => {
    return {
      employeeId: shift.employeeId,
      locationId: shift.locationId ?? undefined,
      position: shift.position ?? undefined,
      note: shift.notes ?? undefined,
      startAt: shift.startsAt,
      endAt: shift.endsAt,
      periodId: periodId ?? undefined,
    };
  }, [periodId]);

  const getFocusedCellMeta = useCallback(() => {
    if (!focusedCell) return null;
    const employee = visibleEmployees[focusedCell.employeeIndex];
    const day = weekDays[focusedCell.dayIndex];
    if (!employee || !day) return null;
    const dateKey = formatDateKey(day);
    const cellShifts = shifts.filter(
      (shift) =>
        shift.employeeId === employee.id &&
        formatDateKey(new Date(shift.startsAt)) === dateKey,
    );
    return {
      employee,
      day,
      dateKey,
      shifts: cellShifts,
    };
  }, [focusedCell, shifts, visibleEmployees, weekDays]);

  const pushHistoryEntry = useCallback(
    (entry: { type: "create" | "delete"; payloads: ScheduleShiftPayload[]; createdIds: string[] }) => {
      undoStackRef.current = [entry, ...undoStackRef.current].slice(0, 20);
      redoStackRef.current = [];
    },
    [],
  );

  const undoHistory = useCallback(async () => {
    const entry = undoStackRef.current[0];
    if (!entry) return false;
    undoStackRef.current = undoStackRef.current.slice(1);
    try {
      if (entry.type === "create") {
        if (!entry.createdIds.length) return false;
        await bulkDeleteMutation.mutateAsync({ shiftIds: entry.createdIds });
      } else {
        if (!entry.payloads.length) return false;
        const created = await bulkCreateMutation.mutateAsync({ shifts: entry.payloads });
        entry.createdIds = created.map((shift) => shift.id);
      }
      redoStackRef.current = [entry, ...redoStackRef.current].slice(0, 20);
      return true;
    } catch {
      if (entry.type === "create") {
        logDeleteFailure();
      }
      pushToast({ title: "Nie udało się cofnąć akcji", variant: "error" });
      return false;
    }
  }, [bulkCreateMutation, bulkDeleteMutation, logDeleteFailure]);

  const redoHistory = useCallback(async () => {
    const entry = redoStackRef.current[0];
    if (!entry) return false;
    redoStackRef.current = redoStackRef.current.slice(1);
    try {
      if (entry.type === "create") {
        const created = await bulkCreateMutation.mutateAsync({ shifts: entry.payloads });
        entry.createdIds = created.map((shift) => shift.id);
      } else {
        if (!entry.createdIds.length) return false;
        await bulkDeleteMutation.mutateAsync({ shiftIds: entry.createdIds });
      }
      undoStackRef.current = [entry, ...undoStackRef.current].slice(0, 20);
      return true;
    } catch {
      if (entry.type === "delete") {
        logDeleteFailure();
      }
      pushToast({ title: "Nie udało się ponowić akcji", variant: "error" });
      return false;
    }
  }, [bulkCreateMutation, bulkDeleteMutation, logDeleteFailure]);

  const handleCopySelection = useCallback(() => {
    if (!selectedShifts.length) {
      pushToast({ title: "Brak zmian do skopiowania", variant: "warning" });
      return false;
    }
    const copied = selectedShifts
      .map((shift) => {
        const dayIndex = weekDays.findIndex(
          (day) => formatDateKey(day) === formatDateKey(new Date(shift.startsAt)),
        );
        const employeeIndex = visibleEmployees.findIndex((emp) => emp.id === shift.employeeId);
        return { shift, dayIndex, employeeIndex };
      })
      .filter((entry) => entry.dayIndex >= 0 && entry.employeeIndex >= 0);
    if (!copied.length) {
      pushToast({ title: "Brak zmian do skopiowania", variant: "warning" });
      return false;
    }
    const anchor = copied[0];
    (window as Window & { __scheduleClipboard?: typeof copied }).__scheduleClipboard = copied.map((entry) => ({
      shift: entry.shift,
      offsetDay: entry.dayIndex - anchor.dayIndex,
      offsetEmployee: entry.employeeIndex - anchor.employeeIndex,
    }));
    pushToast({ title: "Skopiowano zaznaczone", variant: "success" });
    return true;
  }, [selectedShifts, visibleEmployees, weekDays]);

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

  const handlePasteSelection = useCallback(() => {
    const clipboard = (window as Window & {
      __scheduleClipboard?: Array<{ shift: ShiftRecord; offsetDay: number; offsetEmployee: number }>;
    }).__scheduleClipboard;
    if (!clipboard?.length) {
      pushToast({ title: "Schowek jest pusty", variant: "warning" });
      return false;
    }
    if (!focusedCell) {
      pushToast({ title: "Wybierz komórkę docelową", variant: "warning" });
      return false;
    }
    const payloads: ScheduleShiftPayload[] = [];
    for (const entry of clipboard) {
      const targetEmployee = visibleEmployees[focusedCell.employeeIndex + entry.offsetEmployee];
      const targetDay = weekDays[focusedCell.dayIndex + entry.offsetDay];
      if (!targetEmployee || !targetDay) {
        pushToast({ title: "Wklejenie poza zakresem", variant: "warning" });
        return false;
      }
      const start = new Date(entry.shift.startsAt);
      const end = new Date(entry.shift.endsAt);
      const startDate = new Date(targetDay);
      startDate.setHours(start.getHours(), start.getMinutes(), 0, 0);
      const endDate = new Date(targetDay);
      endDate.setHours(end.getHours(), end.getMinutes(), 0, 0);
      if (hasOverlap(targetEmployee.id, startDate, endDate)) {
        pushToast({ title: "Konflikt zmian", description: "Zmiany nachodzą na siebie.", variant: "warning" });
        return false;
      }
      payloads.push({
        employeeId: targetEmployee.id,
        locationId: entry.shift.locationId ?? undefined,
        position: entry.shift.position ?? undefined,
        note: entry.shift.notes ?? undefined,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      });
    }
    if (!payloads.length) {
      pushToast({ title: "Brak zmian do wklejenia", variant: "warning" });
      return false;
    }
    void (async () => {
      try {
        const created = await bulkCreateMutation.mutateAsync({ shifts: payloads });
        pushHistoryEntry({
          type: "create",
          payloads,
          createdIds: created.map((shift) => shift.id),
        });
        pushToast({ title: "Wklejono zmiany", variant: "success" });
      } catch {
        // onError handles toast
      }
    })();
    return true;
  }, [bulkCreateMutation, focusedCell, hasOverlap, pushHistoryEntry, visibleEmployees, weekDays]);

  const handleDeleteSelection = useCallback(() => {
    if (!canManage || !editModeEnabled || isPublished) return false;
    if (!selectedShifts.length) {
      return false;
    }
    const shiftIds = selectedShifts.map((shift) => shift.id);
    const payloads = selectedShifts.map((shift) => buildShiftPayload(shift));
    if (skipDeleteConfirm) {
      void (async () => {
        try {
          await bulkDeleteMutation.mutateAsync({ shiftIds });
          pushHistoryEntry({ type: "delete", payloads, createdIds: shiftIds });
          pushToast({ title: "Usunięto zmiany", variant: "success" });
        } catch {
          // onError handles toast
        }
      })();
      return true;
    }
    setBulkDeleteShiftIds(shiftIds);
    setBulkDeletePayloads(payloads);
    setSkipDeleteConfirmChecked(skipDeleteConfirm);
    setConfirmBulkDelete(true);
    return true;
  }, [
    buildShiftPayload,
    bulkDeleteMutation,
    canManage,
    editModeEnabled,
    isPublished,
    pushHistoryEntry,
    selectedShifts,
    skipDeleteConfirm,
  ]);

  const handleConfirmBulkDelete = useCallback(() => {
    if (!bulkDeleteShiftIds.length) {
      setConfirmBulkDelete(false);
      return;
    }
    if (skipDeleteConfirmChecked) {
      setSessionSkipDeleteConfirm(true);
    }
    void (async () => {
      try {
        await bulkDeleteMutation.mutateAsync({ shiftIds: bulkDeleteShiftIds });
        pushHistoryEntry({
          type: "delete",
          payloads: bulkDeletePayloads,
          createdIds: bulkDeleteShiftIds,
        });
        pushToast({ title: "Usunięto zmiany", variant: "success" });
        setConfirmBulkDelete(false);
        setBulkDeleteShiftIds([]);
        setBulkDeletePayloads([]);
      } catch {
        // onError handles toast
      }
    })();
  }, [
    bulkDeletePayloads,
    bulkDeleteShiftIds,
    bulkDeleteMutation,
    pushHistoryEntry,
    setSessionSkipDeleteConfirm,
    skipDeleteConfirmChecked,
  ]);

  const openShiftModal = useCallback(
    (employeeId?: string, date?: Date) => {
      if (!canManage) return;
      if (isPublished) {
        pushToast({
          title: "Grafik opublikowany",
          description: "Grafik opublikowany — odblokuj, aby edytować.",
          variant: "warning",
        });
        return;
      }
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
    },
    [canManage, isPublished, weekStart],
  );

  const handleEditShift = useCallback(
    (shift: ShiftRecord) => {
      if (!canManage) return;
      if (isPublished) {
        pushToast({
          title: "Grafik opublikowany",
          description: "Grafik opublikowany — odblokuj, aby edytować.",
          variant: "warning",
        });
        return;
      }
      setActiveShift(shift);
      setLockedEmployeeId(null);
      setShiftModalOpen(true);
    },
    [canManage, isPublished],
  );

  const handleOpenDetailsModal = useCallback(() => {
    const meta = getFocusedCellMeta();
    if (!meta) return false;
    if (!meta.shifts.length) {
      openShiftModal(meta.employee.id, meta.day);
      return true;
    }
    handleEditShift(meta.shifts[0]);
    return true;
  }, [getFocusedCellMeta, handleEditShift, openShiftModal]);

  const scrollToGridCell = useCallback((employeeIndex: number, dayIndex: number) => {
    if (typeof document === "undefined") return;
    const cellId = buildGridCellId(employeeIndex, dayIndex);
    requestAnimationFrame(() => {
      const cell = document.getElementById(cellId);
      cell?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }, []);

  const handleGridKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isGridActive()) return;
      if (isTypingTarget(event.target)) return;
      if (event.ctrlKey && event.altKey) return;

      const withMeta = event.metaKey || event.ctrlKey;
      const key = event.key;
      const lowerKey = key.toLowerCase();

      if (key === "Escape") {
        let handled = false;
        if (editModeHoldActive) {
          clearEditModeHoldTimer();
          handled = true;
        }
        if (contextMenuState) {
          setContextMenuState(null);
          handled = true;
        }
        if (rowMenuState) {
          setRowMenuState(null);
          handled = true;
        }
        if (confirmBulkDelete) {
          setConfirmBulkDelete(false);
          handled = true;
        }
        if (confirmDeleteShift) {
          setConfirmDeleteShift(null);
          handled = true;
        }
        if (swapModalShift) {
          setSwapModalShift(null);
          handled = true;
        }
        if (leaveModalState) {
          setLeaveModalState(null);
          handled = true;
        }
        if (shiftModalOpen) {
          setShiftModalOpen(false);
          setActiveShift(null);
          setLockedEmployeeId(null);
          handled = true;
        }
        if (dateRangeModalOpen) {
          setDateRangeModalOpen(false);
          handled = true;
        }
        if (publishModalOpen) {
          setPublishModalOpen(false);
          handled = true;
        }
        if (optionsDrawerOpen) {
          setOptionsDrawerOpen(false);
          handled = true;
        }
        if (!handled && (selectedCells.size > 0 || focusedCell)) {
          setSelectedCells(new Set());
          setSelectionAnchor(null);
          setFocusedCell(null);
          handled = true;
        }
        if (handled) {
          event.preventDefault();
          logHotkeyAction("escape");
        }
        return;
      }

      if (event.code === "Space" && keyboardMode) {
        event.preventDefault();
        setShowShortcuts(true);
        logHotkeyAction("shortcuts");
        return;
      }

      if (event.code === "KeyE" && !withMeta && !event.altKey) {
        if (!canEnableEditMode || isPublished) return;
        if (event.repeat) return;
        event.preventDefault();

        if (editModeEnabled) {
          disableEditMode();
          logHotkeyAction("edit-mode-disable");
          return;
        }

        if (!editModeHoldActive) {
          setEditModeHoldActive(true);
          editModeHoldTimerRef.current = window.setTimeout(() => {
            editModeHoldTimerRef.current = null;
            enableEditMode();
            setEditModeHoldActive(false);
            logHotkeyAction("edit-mode-enable");
          }, EDIT_MODE_HOLD_MS);
          logHotkeyAction("edit-mode-hold-start");
        }
        return;
      }

      if (withMeta) {
        if (lowerKey === "c") {
          if (!canManage) return;
          const handled = handleCopySelection();
          if (handled) {
            event.preventDefault();
            logHotkeyAction("copy");
          }
          return;
        }
        if (lowerKey === "v") {
          if (!canManage || !editModeEnabled || isPublished) return;
          const handled = handlePasteSelection();
          if (handled) {
            event.preventDefault();
            logHotkeyAction("paste");
          }
          return;
        }
        if (lowerKey === "z") {
          if (!canManage || !editModeEnabled || isPublished) return;
          const canHandle = event.shiftKey
            ? redoStackRef.current.length > 0
            : undoStackRef.current.length > 0;
          if (!canHandle) return;
          event.preventDefault();
          if (event.shiftKey) {
            void redoHistory();
            logHotkeyAction("redo");
          } else {
            void undoHistory();
            logHotkeyAction("undo");
          }
          return;
        }
        if (lowerKey === "y") {
          if (!canManage || !editModeEnabled || isPublished) return;
          if (!redoStackRef.current.length) return;
          event.preventDefault();
          void redoHistory();
          logHotkeyAction("redo");
          return;
        }
      }

      if (key === "Delete" || key === "Backspace") {
        if (!canManage || !editModeEnabled || isPublished) return;
        const handled = handleDeleteSelection();
        if (handled) {
          event.preventDefault();
          logHotkeyAction("delete");
        }
        return;
      }

      if (key === "Enter" || key === "F2") {
        if (!canManage) return;
        const handled = handleOpenDetailsModal();
        if (handled) {
          event.preventDefault();
          logHotkeyAction("open-details");
        }
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        if (!focusedCell) {
          if (visibleEmployees.length === 0 || weekDays.length === 0) return;
          updateSelectionFromFocus({ employeeIndex: 0, dayIndex: 0 }, false);
          scrollToGridCell(0, 0);
          event.preventDefault();
          logHotkeyAction("navigate");
          return;
        }
        const delta = {
          ArrowUp: { row: -1, col: 0 },
          ArrowDown: { row: 1, col: 0 },
          ArrowLeft: { row: 0, col: -1 },
          ArrowRight: { row: 0, col: 1 },
        }[key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"];
        const nextRow = Math.max(0, Math.min(visibleEmployees.length - 1, focusedCell.employeeIndex + delta.row));
        const nextCol = Math.max(0, Math.min(weekDays.length - 1, focusedCell.dayIndex + delta.col));
        updateSelectionFromFocus({ employeeIndex: nextRow, dayIndex: nextCol }, event.shiftKey);
        scrollToGridCell(nextRow, nextCol);
        event.preventDefault();
        logHotkeyAction("navigate");
        return;
      }
    },
    [
      canEnableEditMode,
      canManage,
      clearEditModeHoldTimer,
      confirmBulkDelete,
      confirmDeleteShift,
      contextMenuState,
      dateRangeModalOpen,
      disableEditMode,
      editModeEnabled,
      editModeHoldActive,
      enableEditMode,
      focusedCell,
      handleCopySelection,
      handleDeleteSelection,
      handleOpenDetailsModal,
      handlePasteSelection,
      isGridActive,
      isPublished,
      isTypingTarget,
      keyboardMode,
      leaveModalState,
      logHotkeyAction,
      optionsDrawerOpen,
      publishModalOpen,
      redoHistory,
      rowMenuState,
      scrollToGridCell,
      selectedCells,
      shiftModalOpen,
      swapModalShift,
      undoHistory,
      updateSelectionFromFocus,
      visibleEmployees.length,
      weekDays.length,
    ],
  );

  const handleGridKeyUp = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isGridActive()) return;
      if (isTypingTarget(event.target)) return;
      if (event.code === "Space" && keyboardMode) {
        setShowShortcuts(false);
        return;
      }
      if (event.code === "KeyE") {
        clearEditModeHoldTimer();
      }
    },
    [clearEditModeHoldTimer, isGridActive, isTypingTarget, keyboardMode],
  );

  useEffect(() => {
    if (!gridActive) return;
    if (!focusedCell && visibleEmployees.length > 0) {
      updateSelectionFromFocus({ employeeIndex: 0, dayIndex: 0 }, false);
      scrollToGridCell(0, 0);
    }
  }, [focusedCell, gridActive, scrollToGridCell, updateSelectionFromFocus, visibleEmployees.length]);

  useEffect(() => {
    if (!timeBuffer) return;
    const timer = window.setTimeout(() => setTimeBuffer(""), 1800);
    return () => window.clearTimeout(timer);
  }, [timeBuffer]);

  // Set topbar actions
  useEffect(() => {
    setActionsSlot(
      <>
        {canManage && periodId && schedulePeriod?.status === "DRAFT" && (
          <button
            type="button"
            onClick={handleApprovePeriod}
            disabled={lifecyclePending}
            className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm font-semibold text-surface-700 hover:bg-surface-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Zatwierdź grafik
          </button>
        )}
        {canManage && periodId && schedulePeriod?.status === "APPROVED" && (
          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            disabled={lifecyclePending}
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            data-onboarding-target="schedule-publish"
          >
            Opublikuj grafik
          </button>
        )}
        {canManage && periodId && schedulePeriod?.status === "PUBLISHED" && (
          <button
            type="button"
            onClick={handleUnpublishPeriod}
            disabled={lifecyclePending}
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cofnij publikację
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
  }, [
    canManage,
    handleApprovePeriod,
    handleUnpublishPeriod,
    keyboardDisabled,
    keyboardMode,
    lifecyclePending,
    periodId,
    schedulePeriod?.status,
    setActionsSlot,
  ]);

  const contextMenuOptions = useMemo(() => {
    if (!contextMenuState) return [];
    const hasShift = Boolean(contextMenuState.shift);
    const isOwnShift = contextMenuState.shift?.employeeId === currentEmployeeId;
    return getScheduleContextMenuOptions({
      canManage,
      hasShift,
      isOwnShift: Boolean(isOwnShift),
      isPublished,
    });
  }, [canManage, contextMenuState, currentEmployeeId, isPublished]);

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
        isPublished,
      });
      if (!options.length) return;
      setContextMenuState(params);
    },
    [canManage, currentEmployeeId, isPublished],
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

  const handleDropShift = async (shiftId: string, targetEmployeeId: string, targetDate: Date, copy: boolean) => {
    if (isPublished) {
      pushToast({
        title: "Grafik opublikowany",
        description: "Grafik opublikowany — odblokuj, aby edytować.",
        variant: "warning",
      });
      return;
    }
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

    try {
      if (copy) {
        await apiCreateScheduleShift({
          employeeId: targetEmployeeId,
          locationId: sourceShift.locationId ?? undefined,
          position: sourceShift.position ?? undefined,
          note: sourceShift.notes ?? undefined,
          startAt: nextStart.toISOString(),
          endAt: nextEnd.toISOString(),
          periodId: periodId ?? undefined,
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
    } catch (error) {
      handleReadonlyError(error);
    }
  };

  const handleSaveShift = async (payload: ShiftPayload, shiftId?: string) => {
    try {
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
          periodId: periodId ?? undefined,
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
    } catch (error) {
      handleReadonlyError(error);
    }
  };

  const handleSaveBulk = async (payloads: ShiftPayload[]) => {
    if (!payloads.length) return;
    try {
      await bulkCreateMutation.mutateAsync({
        shifts: payloads.map((payload) => ({
          employeeId: payload.employeeId,
          locationId: payload.locationId,
          position: payload.position,
          note: payload.notes,
          startAt: payload.startsAt,
          endAt: payload.endsAt,
          periodId: periodId ?? undefined,
        })),
      });
      pushToast({ title: "Dodano serię zmian", variant: "success" });
      if (editModeEnabled) {
        markEditModeActivity();
      }
    } catch (error) {
      handleReadonlyError(error);
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
      if (handleReadonlyError(error)) {
        return;
      }
      logDeleteFailure();
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
      if (handleReadonlyError(error)) {
        return;
      }
      logDeleteFailure();
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

  const handleApprovePeriod = useCallback(async () => {
    if (!canManage) return;
    if (!periodId) {
      pushToast({
        title: "Brak okresu grafiku",
        description: "Wybierz lokalizację, aby zatwierdzić grafik.",
        variant: "warning",
      });
      return;
    }
    setLifecyclePending(true);
    try {
      await apiApproveGrafikPeriod({ periodId });
      pushToast({ title: "Grafik zatwierdzony", variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    } catch (error) {
      handleReadonlyError(error);
    } finally {
      setLifecyclePending(false);
    }
  }, [canManage, handleReadonlyError, periodId, queryClient]);

  const handlePublishSchedule = async () => {
    if (!canManage) return;
    if (!periodId) {
      pushToast({
        title: "Brak okresu grafiku",
        description: "Wybierz lokalizację, aby opublikować grafik.",
        variant: "warning",
      });
      return;
    }
    const employeeIds = Array.from(new Set(shifts.map((shift) => shift.employeeId)));
    if (!employeeIds.length) {
      pushToast({
        title: "Brak zmian",
        description: "Dodaj zmiany przed publikacją grafiku.",
        variant: "warning",
      });
      return;
    }
    setLifecyclePending(true);
    try {
      const result = await apiPublishGrafikPeriod({
        periodId,
        notify: true,
      });
      pushToast({
        title: "Grafik opublikowany",
        description: `Powiadomiono ${result.notifiedCount} pracowników.`,
        variant: "success",
      });
      setPublishModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    } catch (error) {
      handleReadonlyError(error);
    } finally {
      setLifecyclePending(false);
    }
  };

  const handleUnpublishPeriod = useCallback(async () => {
    if (!canManage) return;
    if (!periodId) {
      pushToast({
        title: "Brak okresu grafiku",
        description: "Wybierz lokalizację, aby cofnąć publikację.",
        variant: "warning",
      });
      return;
    }
    setLifecyclePending(true);
    try {
      await apiUnpublishGrafikPeriod({ periodId });
      pushToast({ title: "Cofnięto publikację grafiku", variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    } catch (error) {
      handleReadonlyError(error);
    } finally {
      setLifecyclePending(false);
    }
  }, [canManage, handleReadonlyError, periodId, queryClient]);

  const handleSortAction = useCallback(() => {
    setSortMode((prev) => (prev === "custom" ? "lastName" : "custom"));
  }, []);

  const handleCellFocus = (employeeIndex: number, dayIndex: number, extend: boolean) => {
    if (typeof document !== "undefined" && !isTypingTarget(document.activeElement)) {
      gridRootRef.current?.focus();
    }
    updateSelectionFromFocus({ employeeIndex, dayIndex }, extend);
  };

  const handleRowMenuSelect = useCallback(
    (actionId: "move-up" | "move-down") => {
      if (!rowMenuState) return;
      if (!orderingEnabled) return;
      const offset = actionId === "move-up" ? -1 : 1;
      moveEmployeeByOffset(rowMenuState.employeeId, offset);
      setRowMenuState(null);
    },
    [moveEmployeeByOffset, orderingEnabled, rowMenuState],
  );

  const rangeLabel = formatShortRangeLabel(weekStart, weekEnd);
  const statusLabel = schedulePeriod ? STATUS_LABELS[schedulePeriod.status] : "Brak okresu";
  const statusTone = schedulePeriod?.status ?? "DRAFT";
  const statusClasses: Record<SchedulePeriodStatus, string> = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-blue-200 bg-blue-50 text-blue-700",
    PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  const statusClassName = schedulePeriod
    ? statusClasses[statusTone]
    : "border-surface-200 bg-surface-50 text-surface-600";
  const activeDescendantId = focusedCell
    ? buildGridCellId(focusedCell.employeeIndex, focusedCell.dayIndex)
    : undefined;

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
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClassName}`}
            data-testid="grafik-status-badge"
          >
            {statusLabel}
          </span>
          {editModeEnabled && (
            <span
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700"
              data-testid="grafik-edit-mode-badge"
            >
              TRYB EDYCJI
            </span>
          )}
        </div>
        <p className="text-sm text-surface-600">
          Układaj zmiany, sprawdzaj dyspozycje i publikuj grafik dla zespołu.
        </p>
        {isPublished && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Grafik opublikowany — obowiązuje pracowników (tryb tylko do odczytu)
          </div>
        )}
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
        editModeDisabled={!canEnableEditMode || isPublished}
        editModeDisabledReason={
          !canEnableEditMode
            ? "Tryb edycji jest dostępny tylko dla managerów i administratorów."
            : "Grafik opublikowany — odblokuj, aby edytować."
        }
        onToggleEditMode={() => {
          if (!canEnableEditMode || isPublished) return;
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

      <div
        ref={gridRootRef}
        tabIndex={0}
        role="grid"
        aria-label="Grafik"
        aria-activedescendant={activeDescendantId || undefined}
        data-testid="grafik-grid-root"
        onPointerDown={handleGridPointerDown}
        onFocusCapture={handleGridFocusCapture}
        onBlurCapture={handleGridBlurCapture}
        onKeyDown={handleGridKeyDown}
        onKeyUp={handleGridKeyUp}
      >
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
          orderingEnabled={orderingEnabled}
          draggedEmployeeId={draggedEmployeeId}
          dragOverEmployeeId={dragOverEmployeeId}
          onRowDragStart={(employeeId) => {
            if (!orderingEnabled) return;
            setDraggedEmployeeId(employeeId);
          }}
          onRowDragOver={(employeeId) => {
            if (!orderingEnabled) return;
            setDragOverEmployeeId(employeeId);
          }}
          onRowDrop={(employeeId) => {
            if (!orderingEnabled || !draggedEmployeeId) return;
            reorderEmployeesById(draggedEmployeeId, employeeId);
            setDraggedEmployeeId(null);
            setDragOverEmployeeId(null);
            markEditModeActivity();
          }}
          onRowDragEnd={() => {
            setDraggedEmployeeId(null);
            setDragOverEmployeeId(null);
          }}
          onOpenRowMenu={(employeeId, position) => {
            if (!orderingEnabled) return;
            openRowMenu(employeeId, position);
          }}
        />
      </div>

      <ScheduleContextMenu
        open={Boolean(contextMenuState)}
        position={contextMenuState?.position ?? null}
        options={contextMenuOptions}
        onClose={() => setContextMenuState(null)}
        onSelect={handleContextMenuSelect}
      />

      <ScheduleContextMenu
        open={Boolean(rowMenuState)}
        position={rowMenuState?.position ?? null}
        options={
          orderingEnabled
            ? [
                { id: "move-up", label: "Przenieś w górę" },
                { id: "move-down", label: "Przenieś w dół" },
              ]
            : []
        }
        onClose={() => setRowMenuState(null)}
        onSelect={(optionId) => {
          if (optionId === "move-up" || optionId === "move-down") {
            handleRowMenuSelect(optionId);
          }
        }}
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
              <li>Enter / F2 — szczegóły zmiany</li>
              <li>Ctrl/Cmd + C / V — kopiuj / wklej</li>
              <li>Delete / Backspace — usuń zaznaczone</li>
              <li>Ctrl/Cmd + Z / Shift + Z / Y — cofaj / ponów</li>
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

      <Modal
        open={confirmBulkDelete}
        title="Usuń zaznaczone zmiany"
        description="Ta operacja jest nieodwracalna."
        onClose={() => setConfirmBulkDelete(false)}
        variant="light"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(false)}
              className="rounded-md border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-100"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Usuń zmiany
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-surface-600">
          <p>Wybrane zmiany zostaną trwale usunięte z grafiku.</p>
          <label className="flex items-center gap-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={skipDeleteConfirmChecked}
              onChange={(event) => setSkipDeleteConfirmChecked(event.target.checked)}
              className="h-4 w-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
            />
            Nie pokazuj ponownie w tej sesji
          </label>
        </div>
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
              disabled={lifecyclePending}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
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
