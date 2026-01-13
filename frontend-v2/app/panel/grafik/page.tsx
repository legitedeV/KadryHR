"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";
import {
  apiClearWeek,
  apiCopyPreviousWeek,
  apiCreateScheduleTemplateFromWeek,
  apiCreateShift,
  apiDeleteShift,
  apiGetAvailability,
  apiGetScheduleMetadata,
  apiGetScheduleTemplate,
  apiGetShifts,
  apiListEmployees,
  apiListLocations,
  apiListScheduleTemplates,
  apiPublishSchedule,
  apiUpdateShift,
  apiGetApprovedLeavesForSchedule,
  ApprovedLeaveForSchedule,
  AvailabilityRecord,
  EmployeeRecord,
  LocationRecord,
  ScheduleMetadata,
  ScheduleTemplateRecord,
  ShiftPayload,
  ShiftRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ClearWeekModal } from "./components/ClearWeekModal";
import { PublishScheduleModal } from "./components/PublishScheduleModal";
import { ScheduleGrid, countAfternoonPromotions } from "./components/ScheduleGrid";
import { ScheduleHeader } from "./components/ScheduleHeader";
import { ShiftEditorModal } from "./components/ShiftEditorModal";
import { TemplatesDialog } from "./components/TemplatesDialog";
import { AvailabilityOverrideModal } from "./components/AvailabilityOverrideModal";
import type { AvailabilityIndicator, ShiftDisplay, ShiftFormState, WeekRange } from "./types";

const dowOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const dowFromDate = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const FULL_DAY_MINUTES = 6 * 60;

function getWeekRange(anchor: Date = new Date()): WeekRange {
  const day = anchor.getDay() || 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const sameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear();
  const dayFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" });
  const fullFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  return {
    from: fmt(monday),
    to: fmt(sunday),
    label: sameMonth
      ? `${dayFormatter.format(monday)}–${dayFormatter.format(sunday)} ${monthFormatter.format(sunday)}`
      : `${fullFormatter.format(monday)} – ${fullFormatter.format(sunday)}`,
  };
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapShiftRecord(
  record: ShiftRecord,
  employees: EmployeeRecord[],
  locations: LocationRecord[],
): ShiftDisplay {
  const startDate = new Date(record.startsAt);
  const endDate = new Date(record.endsAt);
  const employee =
    (record.employeeId && employees.find((e) => e.id === record.employeeId)) || record.employee;
  const employeeName = employee
    ? `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
      ("email" in employee ? (employee as EmployeeRecord).email ?? "" : "") ||
      "Pracownik"
    : "Nieprzypisana";
  const location =
    (record.locationId && locations.find((loc) => loc.id === record.locationId)) || record.location;
  const locationName = location?.name ?? "Brak lokalizacji";

  return {
    id: record.id,
    date: startDate.toISOString().slice(0, 10),
    start: formatTime(startDate),
    end: formatTime(endDate),
    employeeName,
    employeeId: record.employeeId,
    employeeAvatar: record.employee?.avatarUrl ?? null,
    locationName,
    locationId: record.locationId,
    status: record.employeeId ? "ASSIGNED" : "UNASSIGNED",
    availabilityWarning: record.availabilityWarning ?? null,
    position: record.position,
    color: record.color ?? null,
  };
}

function getDowKey(date: string) {
  const d = new Date(date);
  const idx = d.getDay();
  if (Number.isNaN(idx) || idx < 0 || idx > 6) return "Sun";
  return dowFromDate[idx] ?? "Sun";
}

function buildPayloadFromForm(form: ShiftFormState): ShiftPayload {
  const startsAt = new Date(`${form.date}T${form.startTime}:00`);
  const endsAt = new Date(`${form.date}T${form.endTime}:00`);
  return {
    employeeId: form.employeeId,
    locationId: form.locationId || undefined,
    position: form.position || undefined,
    notes: form.notes || undefined,
    color: form.color || undefined,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export function buildShiftDescription(
  shift: ShiftRecord,
  employees: EmployeeRecord[],
  locations: LocationRecord[],
) {
  const employee = employees.find((e) => e.id === shift.employeeId);
  const location = locations.find((loc) => loc.id === shift.locationId);
  const startDate = new Date(shift.startsAt);
  const endDate = new Date(shift.endsAt);
  const employeeLabel = employee
    ? `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Pracownik"
    : "Nieprzypisana";
  const dateLabel = startDate.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = `${formatTime(startDate)}–${formatTime(endDate)}`;
  const locationLabel = location?.name ?? "Bez lokalizacji";

  return `${employeeLabel} • ${dateLabel} • ${timeLabel} • ${locationLabel}`;
}

export { ConfirmDialog };

function getAvailabilityIndicator(dayAvail: AvailabilityRecord[]): AvailabilityIndicator {
  const totalMinutes = dayAvail.reduce((sum, slot) => sum + Math.max(0, slot.endMinutes - slot.startMinutes), 0);
  if (totalMinutes >= FULL_DAY_MINUTES) {
    return {
      status: "available",
      label: "Dostępny przez większość dnia",
      windows: dayAvail,
    };
  }
  if (totalMinutes > 0) {
    return {
      status: "partial",
      label: "Częściowa dostępność",
      windows: dayAvail,
    };
  }
  return {
    status: "unavailable",
    label: "Brak dostępności",
    windows: dayAvail,
  };
}

function getAvailabilitySeverity(dayAvail: AvailabilityRecord[], startMinutes: number, endMinutes: number) {
  if (!dayAvail.length) {
    return "outside" as const;
  }

  const windows = dayAvail
    .map((slot) => ({ start: slot.startMinutes, end: slot.endMinutes }))
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  windows.forEach((slot) => {
    if (!merged.length) {
      merged.push({ ...slot });
      return;
    }
    const last = merged[merged.length - 1];
    if (slot.start <= last.end) {
      last.end = Math.max(last.end, slot.end);
    } else {
      merged.push({ ...slot });
    }
  });

  const overlaps = merged.some((slot) => startMinutes < slot.end && endMinutes > slot.start);
  const fullyCovered = merged.some((slot) => startMinutes >= slot.start && endMinutes <= slot.end);

  if (fullyCovered) return "available" as const;
  if (overlaps) return "partial" as const;
  return "outside" as const;
}

function getWeekdayIndex(weekday: string) {
  switch (weekday) {
    case "MONDAY":
      return 0;
    case "TUESDAY":
      return 1;
    case "WEDNESDAY":
      return 2;
    case "THURSDAY":
      return 3;
    case "FRIDAY":
      return 4;
    case "SATURDAY":
      return 5;
    default:
      return 6;
  }
}

export default function GrafikPage() {
  const [range, setRange] = useState<WeekRange>(() => getWeekRange());
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [approvedLeaves, setApprovedLeaves] = useState<ApprovedLeaveForSchedule[]>([]);
  const [scheduleMetadata, setScheduleMetadata] = useState<ScheduleMetadata | null>(null);
  const [templates, setTemplates] = useState<ScheduleTemplateRecord[]>([]);
  const [draggedShift, setDraggedShift] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [copyingWeek, setCopyingWeek] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [pendingAvailabilitySeverity, setPendingAvailabilitySeverity] = useState<"partial" | "outside" | null>(null);
  const [availabilityOverrideReason, setAvailabilityOverrideReason] = useState("");
  const [pendingAction, setPendingAction] = useState<
    | { type: "create"; payload: ShiftPayload }
    | { type: "update"; payload: ShiftPayload; shiftId: string }
    | { type: "bulk"; payloads: ShiftPayload[] }
    | null
  >(null);

  const hasToken = useMemo(() => !!getAccessToken(), []);
  const [loading, setLoading] = useState(hasToken);
  const [error, setError] = useState<string | null>(
    hasToken ? null : "Zaloguj się, aby zobaczyć grafik.",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [clearWeekOpen, setClearWeekOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftRecord | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);
  const [form, setForm] = useState<ShiftFormState>(() => ({
    employeeId: "",
    locationId: undefined,
    position: "",
    notes: "",
    color: "",
    date: range.from,
    startTime: "09:00",
    endTime: "17:00",
  }));

  useEffect(() => {
    if (!hasToken) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiListEmployees({ take: 100, skip: 0, status: "active" }),
      apiListLocations(),
      apiGetShifts({ from: range.from, to: range.to }),
      apiGetAvailability({ from: range.from, to: range.to }),
      apiGetScheduleMetadata({ from: range.from, to: range.to }),
      apiGetApprovedLeavesForSchedule({ from: range.from, to: range.to }),
    ])
      .then(([employeeResponse, locationResponse, shiftResponse, availabilityResponse, metadataResponse, approvedLeavesResponse]) => {
        if (!isMounted) return;
        setEmployees(employeeResponse.data);
        setLocations(locationResponse);
        setShifts(shiftResponse);
        setAvailability(availabilityResponse);
        setScheduleMetadata(metadataResponse);
        setApprovedLeaves(approvedLeavesResponse);
        if (!employeeResponse.data.length) {
          setFormError("Dodaj pracowników, aby przypisać ich do zmian.");
        }
      })
      .catch((err) => {
        console.error(err);
        if (!isMounted) return;
        setError("Nie udało się pobrać grafiku z backendu");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hasToken, range.from, range.to]);

  // Build approved leaves lookup by employee and day
  const approvedLeavesByEmployeeAndDay: Record<string, Record<string, ApprovedLeaveForSchedule[]>> = useMemo(() => {
    const grid: Record<string, Record<string, ApprovedLeaveForSchedule[]>> = {};

    employees.forEach((emp) => {
      grid[emp.id] = {};
      dowOrder.forEach((dow) => {
        grid[emp.id][dow] = [];
      });
    });

    approvedLeaves.forEach((leave) => {
      if (!leave.employeeId || !grid[leave.employeeId]) return;
      
      // Check each day of the week
      const startDate = new Date(range.from);
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().slice(0, 10);
        
        const leaveStart = new Date(leave.startDate).toISOString().slice(0, 10);
        const leaveEnd = new Date(leave.endDate).toISOString().slice(0, 10);
        
        if (dateStr >= leaveStart && dateStr <= leaveEnd) {
          const dow = dowOrder[i];
          grid[leave.employeeId][dow].push(leave);
        }
      }
    });

    return grid;
  }, [employees, approvedLeaves, range.from]);

  const gridByEmployeeAndDay: Record<string, Record<string, ReturnType<typeof mapShiftRecord>[]>> = useMemo(() => {
    const grid: Record<string, Record<string, ReturnType<typeof mapShiftRecord>[]>> = {};

    employees.forEach((emp) => {
      grid[emp.id] = {};
      dowOrder.forEach((dow) => {
        grid[emp.id][dow] = [];
      });
    });

    const filteredShifts = selectedLocationId
      ? shifts.filter((shift) => shift.locationId === selectedLocationId)
      : shifts;

    filteredShifts.forEach((s) => {
      const display = mapShiftRecord(s, employees, locations);
      if (!display.employeeId) return;
      const key = getDowKey(display.date);
      if (grid[display.employeeId] && grid[display.employeeId][key]) {
        grid[display.employeeId][key].push(display);
      }
    });

    return grid;
  }, [employees, locations, selectedLocationId, shifts]);

  const availabilityByEmployeeAndDay: Record<string, Record<string, AvailabilityRecord[]>> = useMemo(() => {
    const grid: Record<string, Record<string, AvailabilityRecord[]>> = {};

    employees.forEach((emp) => {
      grid[emp.id] = {};
      dowOrder.forEach((dow) => {
        grid[emp.id][dow] = [];
      });
    });

    const weekdayMap: Record<string, typeof dowOrder[number]> = {
      MONDAY: "Mon",
      TUESDAY: "Tue",
      WEDNESDAY: "Wed",
      THURSDAY: "Thu",
      FRIDAY: "Fri",
      SATURDAY: "Sat",
      SUNDAY: "Sun",
    };

    availability.forEach((a) => {
      if (!a.employeeId) return;

      let key: string | undefined;
      if (a.weekday) {
        key = weekdayMap[a.weekday];
      } else if (a.date) {
        key = getDowKey(a.date);
      }

      if (key && grid[a.employeeId] && grid[a.employeeId][key]) {
        grid[a.employeeId][key].push(a);
      }
    });

    return grid;
  }, [employees, availability]);

  const availabilityIndicators = useMemo(() => {
    const indicators: Record<string, Record<string, AvailabilityIndicator>> = {};
    employees.forEach((employee) => {
      indicators[employee.id] = {};
      dowOrder.forEach((dow) => {
        const dayAvail = availabilityByEmployeeAndDay[employee.id]?.[dow] ?? [];
        indicators[employee.id][dow] = getAvailabilityIndicator(dayAvail);
      });
    });
    return indicators;
  }, [availabilityByEmployeeAndDay, employees]);

  const visibleShifts = useMemo(() => {
    return selectedLocationId ? shifts.filter((shift) => shift.locationId === selectedLocationId) : shifts;
  }, [selectedLocationId, shifts]);

  const promotionAfternoonCounts = useMemo(() => {
    return countAfternoonPromotions(visibleShifts, scheduleMetadata);
  }, [scheduleMetadata, visibleShifts]);

  const handleWeekChange = (direction: "next" | "prev") => {
    const currentStart = new Date(range.from);
    const delta = direction === "next" ? 7 : -7;
    currentStart.setDate(currentStart.getDate() + delta);
    setRange(getWeekRange(currentStart));
  };

  const resetForm = (date?: string, employeeId?: string) => {
    setForm({
      employeeId: employeeId ?? employees[0]?.id ?? "",
      locationId: selectedLocationId || locations[0]?.id,
      position: "",
      notes: "",
      color: "",
      date: date ?? range.from,
      startTime: "09:00",
      endTime: "17:00",
    });
    setEditingShift(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const openCreateModal = (date?: string, employeeId?: string) => {
    resetForm(date, employeeId);
    setEditorOpen(true);
  };

  const openEditModal = (shift: ShiftRecord) => {
    const startDate = new Date(shift.startsAt);
    const endDate = new Date(shift.endsAt);
    setForm({
      employeeId: shift.employeeId ?? "",
      locationId: shift.locationId ?? undefined,
      position: shift.position ?? "",
      notes: shift.notes ?? "",
      color: shift.color ?? "",
      date: startDate.toISOString().slice(0, 10),
      startTime: startDate.toISOString().slice(11, 16),
      endTime: endDate.toISOString().slice(11, 16),
    });
    setEditingShift(shift);
    setEditorOpen(true);
  };

  const handleDragStart = (shiftId: string, event: DragEvent<HTMLDivElement>) => {
    setDraggedShift(shiftId);
    event.dataTransfer.setData("text/plain", shiftId);
    event.dataTransfer.effectAllowed = "move";
    const target = event.currentTarget;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.pointerEvents = "none";
    clone.style.width = `${target.offsetWidth}px`;
    clone.style.boxShadow = "0 20px 35px rgba(15, 23, 42, 0.35)";
    document.body.appendChild(clone);
    event.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, clone.offsetHeight / 2);
    requestAnimationFrame(() => {
      clone.remove();
    });
  };

  const checkAvailabilityForPayload = (payload: ShiftPayload) => {
    const dateKey = payload.startsAt.slice(0, 10);
    const dowKey = getDowKey(dateKey);
    const dayAvail = availabilityByEmployeeAndDay[payload.employeeId]?.[dowKey] ?? [];
    const startDate = new Date(payload.startsAt);
    const endDate = new Date(payload.endsAt);
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    return getAvailabilitySeverity(dayAvail, startMinutes, endMinutes);
  };

  const queueAvailabilityOverride = (
    severity: "partial" | "outside",
    action: { type: "create"; payload: ShiftPayload } | { type: "update"; payload: ShiftPayload; shiftId: string } | { type: "bulk"; payloads: ShiftPayload[] },
  ) => {
    setPendingAvailabilitySeverity(severity);
    setAvailabilityOverrideReason("");
    setPendingAction(action);
  };

  const executeAction = async (
    action: { type: "create"; payload: ShiftPayload } | { type: "update"; payload: ShiftPayload; shiftId: string } | { type: "bulk"; payloads: ShiftPayload[] },
    overrideReason?: string,
  ) => {
    if (action.type === "create") {
      const payload = overrideReason
        ? { ...action.payload, availabilityOverrideReason: overrideReason }
        : action.payload;
      const created = await apiCreateShift(payload);
      setShifts((prev) => [created, ...prev]);
      setFormSuccess("Zmiana została dodana.");
    } else if (action.type === "update") {
      const payload = overrideReason
        ? { ...action.payload, availabilityOverrideReason: overrideReason }
        : action.payload;
      const updated = await apiUpdateShift(action.shiftId, payload);
      setShifts((prev) => prev.map((s) => (s.id === action.shiftId ? updated : s)));
      setFormSuccess("Zmiana została zaktualizowana.");
    } else {
      const payloads = overrideReason
        ? action.payloads.map((payload) => ({ ...payload, availabilityOverrideReason: overrideReason }))
        : action.payloads;
      const results = await Promise.allSettled(payloads.map((payload) => apiCreateShift(payload)));
      const createdShifts = results
        .filter((result): result is PromiseFulfilledResult<ShiftRecord> => result.status === "fulfilled")
        .map((result) => result.value);
      setShifts((prev) => [...createdShifts, ...prev]);
      const failedCount = results.filter((result) => result.status === "rejected").length;
      if (failedCount > 0) {
        setFormError(`Nie udało się dodać ${failedCount} zmian z powodu konfliktów lub błędów.`);
      } else {
        setFormSuccess(`Dodano ${createdShifts.length} zmian.`);
      }
    }
  };

  const handleAvailabilityConfirm = async () => {
    if (!pendingAvailabilitySeverity || !pendingAction) return;
    setPendingAvailabilitySeverity(null);
    const action = pendingAction;
    setPendingAction(null);
    try {
      if (action.type === "bulk") {
        setBulkCreating(true);
      } else {
        setSaving(true);
      }
      await executeAction(action, availabilityOverrideReason.trim() || undefined);
      setEditorOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się zapisać zmiany. Spróbuj ponownie.");
    } finally {
      setSaving(false);
      setBulkCreating(false);
      setAvailabilityOverrideReason("");
    }
  };

  const handleDrop = async (event: DragEvent<HTMLTableCellElement>, targetDate: string, targetEmployeeId: string) => {
    event.preventDefault();
    const shiftId = event.dataTransfer.getData("text/plain");
    if (!shiftId || !draggedShift) return;

    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    const originalStart = new Date(shift.startsAt);
    const originalEnd = new Date(shift.endsAt);
    const duration = originalEnd.getTime() - originalStart.getTime();

    const [year, month, day] = targetDate.split("-").map(Number);
    const newStart = new Date(
      year,
      month - 1,
      day,
      originalStart.getHours(),
      originalStart.getMinutes(),
      originalStart.getSeconds(),
      originalStart.getMilliseconds(),
    );
    const newEnd = new Date(newStart.getTime() + duration);

    const payload: ShiftPayload = {
      employeeId: targetEmployeeId,
      startsAt: newStart.toISOString(),
      endsAt: newEnd.toISOString(),
    };

    const severity = checkAvailabilityForPayload(payload);
    if (severity !== "available") {
      queueAvailabilityOverride(severity, { type: "update", payload, shiftId });
      setDraggedShift(null);
      return;
    }

    try {
      const updated = await apiUpdateShift(shiftId, payload);
      setShifts((prev) => prev.map((s) => (s.id === shiftId ? updated : s)));
      setFormSuccess("Zmiana została przeniesiona.");
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się przenieść zmiany.");
    } finally {
      setDraggedShift(null);
    }
  };

  const handleSave = async () => {
    if (!form.employeeId) {
      setFormError("Wybierz pracownika, aby zapisać zmianę.");
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);
    if (start >= end) {
      setFormError("Godzina zakończenia musi być po godzinie rozpoczęcia.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload = buildPayloadFromForm(form);
    const severity = checkAvailabilityForPayload(payload);
    if (severity !== "available") {
      queueAvailabilityOverride(severity, editingShift ? { type: "update", payload, shiftId: editingShift.id } : { type: "create", payload });
      setSaving(false);
      return;
    }

    try {
      if (editingShift) {
        await executeAction({ type: "update", payload, shiftId: editingShift.id });
      } else {
        await executeAction({ type: "create", payload });
      }
      setEditorOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się zapisać zmiany. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDeleteShift(deleteTarget.id);
      setShifts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
      setError("Nie udało się usunąć zmiany.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePublish = async () => {
    const employeeIds = Array.from(new Set(shifts.map((s) => s.employeeId).filter(Boolean))) as string[];
    if (employeeIds.length === 0) {
      setFormError("Brak obsadzonych zmian w tym tygodniu do powiadomienia.");
      return;
    }
    setPublishing(true);
    setFormError(null);
    try {
      const result = await apiPublishSchedule({
        employeeIds,
        dateRange: { from: range.from, to: range.to },
      });
      setFormSuccess(`Powiadomiono ${result.notified} pracowników o grafiku.`);
      setPublishOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się opublikować grafiku.");
    } finally {
      setPublishing(false);
    }
  };

  const handleClearWeek = async () => {
    setClearing(true);
    setFormError(null);
    try {
      const result = await apiClearWeek({
        from: range.from,
        to: range.to,
      });
      setShifts([]);
      setFormSuccess(`Usunięto ${result.deletedCount} zmian z tego tygodnia.`);
      setClearWeekOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się wyczyścić tygodnia.");
    } finally {
      setClearing(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    setTemplatesError(null);
    try {
      const data = await apiListScheduleTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
      setTemplatesError("Nie udało się pobrać szablonów.");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOpenTemplates = () => {
    setTemplatesOpen(true);
    if (!templates.length) {
      void loadTemplates();
    }
  };

  const handleCreateTemplate = async (name: string) => {
    setCreatingTemplate(true);
    setTemplatesError(null);
    try {
      await apiCreateScheduleTemplateFromWeek({
        name,
        from: range.from,
        to: range.to,
      });
      await loadTemplates();
      setFormSuccess("Szablon został zapisany.");
    } catch (err) {
      console.error(err);
      setTemplatesError("Nie udało się zapisać szablonu.");
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    setApplyingTemplateId(templateId);
    setFormError(null);
    try {
      const template = await apiGetScheduleTemplate(templateId);
      const monday = new Date(range.from);
      const payloads: ShiftPayload[] = template.shifts.map((shift) => {
        const dayOffset = getWeekdayIndex(shift.weekday);
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + dayOffset);
        const startDate = new Date(dayDate);
        startDate.setMinutes(startDate.getMinutes() + shift.startMinutes);
        const endDate = new Date(dayDate);
        endDate.setMinutes(endDate.getMinutes() + shift.endMinutes);
        return {
          employeeId: shift.employeeId,
          locationId: shift.locationId ?? undefined,
          position: shift.position ?? undefined,
          notes: shift.notes ?? undefined,
          color: shift.color ?? undefined,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
        };
      });

      const severities = payloads.map((payload) => checkAvailabilityForPayload(payload));
      if (severities.includes("outside") || severities.includes("partial")) {
        const severity = severities.includes("outside") ? "outside" : "partial";
        queueAvailabilityOverride(severity, { type: "bulk", payloads });
      } else {
        setBulkCreating(true);
        await executeAction({ type: "bulk", payloads });
      }
      setTemplatesOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się zastosować szablonu.");
    } finally {
      setBulkCreating(false);
      setApplyingTemplateId(null);
    }
  };

  const handleCopyPreviousWeek = async () => {
    setCopyingWeek(true);
    setFormError(null);
    try {
      const payloads = await apiCopyPreviousWeek({ from: range.from, to: range.to });
      if (payloads.length === 0) {
        setFormError("Brak zmian do skopiowania z poprzedniego tygodnia.");
        return;
      }
      const severities = payloads.map((payload) => checkAvailabilityForPayload(payload));
      if (severities.includes("outside") || severities.includes("partial")) {
        const severity = severities.includes("outside") ? "outside" : "partial";
        queueAvailabilityOverride(severity, { type: "bulk", payloads });
      } else {
        await executeAction({ type: "bulk", payloads });
      }
      setCopyConfirmOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się skopiować poprzedniego tygodnia.");
    } finally {
      setCopyingWeek(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-6">
        <div className="sticky top-4 z-20 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-surface-200/60 bg-surface-50/80 backdrop-blur dark:border-surface-800/70 dark:bg-surface-950/80">
          <ScheduleHeader
            range={range}
            shiftsCount={visibleShifts.length}
            locations={locations}
            selectedLocationId={selectedLocationId}
            onPrevWeek={() => handleWeekChange("prev")}
            onNextWeek={() => handleWeekChange("next")}
            onCurrentWeek={() => setRange(getWeekRange())}
            onPublish={() => setPublishOpen(true)}
            onClearWeek={() => setClearWeekOpen(true)}
            onCopyPreviousWeek={() => setCopyConfirmOpen(true)}
            onOpenTemplates={handleOpenTemplates}
            onAddShift={() => openCreateModal()}
            onLocationChange={setSelectedLocationId}
            copying={copyingWeek}
            templatesLoading={loadingTemplates}
          />
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ładowanie grafiku...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {formSuccess && (
              <div className="text-sm text-emerald-700 dark:text-emerald-200">{formSuccess}</div>
            )}
            {formError && <div className="text-sm text-rose-600 dark:text-rose-300">{formError}</div>}
            <ScheduleGrid
              range={range}
              employees={employees}
              shifts={visibleShifts}
              gridByEmployeeAndDay={gridByEmployeeAndDay}
              availabilityIndicators={availabilityIndicators}
              approvedLeavesByEmployeeAndDay={approvedLeavesByEmployeeAndDay}
              draggedShift={draggedShift}
              scheduleMetadata={scheduleMetadata}
              promotionAfternoonCounts={promotionAfternoonCounts}
              onDragStart={handleDragStart}
              onDropShift={handleDrop}
              onOpenCreate={openCreateModal}
              onOpenEdit={openEditModal}
              onDeleteShift={(shift) => setDeleteTarget(shift)}
            />
          </>
        )}
      </div>

      <ShiftEditorModal
        open={editorOpen}
        isEditing={!!editingShift}
        form={form}
        employees={employees}
        locations={locations}
        availabilityLabel={
          form.employeeId
            ? availabilityIndicators[form.employeeId]?.[getDowKey(form.date)]?.label
            : undefined
        }
        availabilityWindows={
          form.employeeId ? availabilityByEmployeeAndDay[form.employeeId]?.[getDowKey(form.date)] ?? [] : []
        }
        approvedLeaves={
          form.employeeId ? approvedLeavesByEmployeeAndDay[form.employeeId]?.[getDowKey(form.date)] ?? [] : []
        }
        saving={saving}
        formError={formError}
        onClose={() => setEditorOpen(false)}
        onReset={() => resetForm(form.date, form.employeeId)}
        onSave={handleSave}
        onFormChange={setForm}
      />

      <PublishScheduleModal
        open={publishOpen}
        range={range}
        publishing={publishing}
        onClose={() => setPublishOpen(false)}
        onPublish={handlePublish}
      />

      <ClearWeekModal
        open={clearWeekOpen}
        range={range}
        shiftCount={shifts.length}
        clearing={clearing}
        onClose={() => setClearWeekOpen(false)}
        onConfirm={handleClearWeek}
      />

      <TemplatesDialog
        open={templatesOpen}
        templates={templates}
        loading={loadingTemplates}
        error={templatesError}
        creating={creatingTemplate}
        busy={bulkCreating}
        applyingTemplateId={applyingTemplateId}
        onClose={() => setTemplatesOpen(false)}
        onCreateTemplate={handleCreateTemplate}
        onApplyTemplate={handleApplyTemplate}
      />

      <AvailabilityOverrideModal
        open={!!pendingAvailabilitySeverity}
        severity={pendingAvailabilitySeverity ?? "partial"}
        reason={availabilityOverrideReason}
        onReasonChange={setAvailabilityOverrideReason}
        onConfirm={handleAvailabilityConfirm}
        onClose={() => {
          setPendingAvailabilitySeverity(null);
          setPendingAction(null);
          setAvailabilityOverrideReason("");
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Usuń zmianę"
        description={
          deleteTarget
            ? buildShiftDescription(deleteTarget, employees, locations)
            : "Czy na pewno chcesz usunąć zmianę?"
        }
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={copyConfirmOpen}
        title="Skopiować poprzedni tydzień?"
        description={`Skopiujemy wszystkie zmiany z poprzedniego tygodnia do zakresu ${range.label}.`}
        confirmLabel="Kopiuj"
        cancelLabel="Anuluj"
        onConfirm={handleCopyPreviousWeek}
        onCancel={() => setCopyConfirmOpen(false)}
      />
    </div>
  );
}
