"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiCopyRange,
  apiCreateScheduleTemplateFromWeek,
  apiCreateShift,
  apiDeleteShift,
  apiGetApprovedLeaves,
  apiGetAvailability,
  apiGetScheduleTemplate,
  apiGetShiftSummary,
  apiGetShifts,
  apiListEmployees,
  apiListLocations,
  apiListScheduleTemplates,
  apiPublishSchedule,
  apiUpdateShift,
  ApprovedLeaveRecord,
  AvailabilityRecord,
  EmployeeRecord,
  LocationRecord,
  ScheduleTemplateRecord,
  ShiftPayload,
  ShiftRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { pushToast } from "@/lib/toast";
import { usePermissions } from "@/lib/use-permissions";
import { Modal } from "@/components/Modal";
import { ScheduleGrid } from "./ScheduleGrid";
import { ScheduleSummaryPanel } from "./ScheduleSummaryPanel";
import { ScheduleToolbar } from "./ScheduleToolbar";
import { ShiftModal } from "./ShiftModal";
import {
  addDays,
  formatDateKey,
  startOfWeek,
} from "./schedule-utils";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";

type ShiftSummary = { employeeId: string; employeeName: string; hours: number };

const PUBLISHED_STORAGE_KEY = "kadryhr:schedule-v2:published";

export function SchedulePage() {
  const { hasAnyPermission } = usePermissions();
  const { startScheduleTour, hasScheduleTourCompleted, hasScheduleTourSkipped, isReady } = useOnboarding();
  const [hasToken] = useState(() => Boolean(getAccessToken()));
  const canManage = hasAnyPermission(["SCHEDULE_MANAGE", "RCP_EDIT"]);

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplateRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [leaves, setLeaves] = useState<ApprovedLeaveRecord[]>([]);
  const [summary, setSummary] = useState<ShiftSummary[]>([]);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));
  const [error, setError] = useState<string | null>(() =>
    getAccessToken() ? null : "Zaloguj się, aby zobaczyć grafik.",
  );

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [initialShiftDate, setInitialShiftDate] = useState<Date | null>(null);

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState(formatDateKey(new Date()));
  const [copyTargetDate, setCopyTargetDate] = useState(formatDateKey(addDays(new Date(), 7)));
  const [copyMode, setCopyMode] = useState<"week" | "day">("week");
  const [copyResult, setCopyResult] = useState<string | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateApplyOpen, setTemplateApplyOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

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

  const visibleEmployees = useMemo(() => {
    if (!selectedLocationId) return employees;
    return employees.filter((employee) =>
      employee.locations?.some((location) => location.id === selectedLocationId),
    );
  }, [employees, selectedLocationId]);

  const weekKey = formatDateKey(weekStart);
  const isPublished = publishedWeeks.includes(weekKey);

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
    apiListScheduleTemplates()
      .then((response) => setTemplates(response))
      .catch(() => null);
  }, [hasToken]);

  const loadSchedule = useCallback(() => {
    if (!hasToken) return;
    setLoading(true);
    const from = formatDateKey(weekStart);
    const to = formatDateKey(weekEnd);
    Promise.all([
      apiGetShifts({ from, to, locationId: selectedLocationId || undefined }),
      apiGetAvailability({ from, to }),
      apiGetApprovedLeaves({ from, to }),
      apiGetShiftSummary({ from, to, locationId: selectedLocationId || undefined }),
    ])
      .then(([shiftsResponse, availabilityResponse, leaveResponse, summaryResponse]) => {
        setShifts(shiftsResponse);
        setAvailability(availabilityResponse);
        setLeaves(leaveResponse);
        setSummary(summaryResponse);
        setError(null);
      })
      .catch((errorResponse) => {
        console.error(errorResponse);
        setError("Nie udało się pobrać grafiku.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hasToken, selectedLocationId, weekEnd, weekStart]);

  useEffect(() => {
    if (!hasToken) return;
    const timer = window.setTimeout(() => {
      loadSchedule();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasToken, loadSchedule]);

  useEffect(() => {
    if (!isReady) return;
    if (hasScheduleTourCompleted || hasScheduleTourSkipped) return;
    const timer = setTimeout(() => startScheduleTour(), 500);
    return () => clearTimeout(timer);
  }, [hasScheduleTourCompleted, hasScheduleTourSkipped, isReady, startScheduleTour]);

  const handleWeekChange = (value: string) => {
    const nextDate = startOfWeek(new Date(`${value}T00:00:00`));
    setWeekStart(nextDate);
  };

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
      const result = await apiCreateShift(payload);
      if (result.availabilityWarning || result.leaveWarning) {
        pushToast({
          title: "Uwaga",
          description: result.availabilityWarning ?? result.leaveWarning ?? undefined,
          variant: "warning",
        });
      }
    }
    await loadSchedule();
  };

  const handleDeleteShift = async (shiftId: string) => {
    await apiDeleteShift(shiftId);
    await loadSchedule();
    setShiftModalOpen(false);
    setActiveShift(null);
  };

  const handleCopySchedule = async () => {
    if (!canManage) return;
    const source = new Date(`${copySourceDate}T00:00:00`);
    const target = new Date(`${copyTargetDate}T00:00:00`);
    const sourceTo = addDays(source, copyMode === "week" ? 7 : 1);

    const payloads = await apiCopyRange({
      sourceFrom: source.toISOString(),
      sourceTo: sourceTo.toISOString(),
      targetFrom: target.toISOString(),
      locationId: selectedLocationId || undefined,
    });

    const results = await Promise.allSettled(payloads.map((payload) => apiCreateShift(payload)));
    const successCount = results.filter((result) => result.status === "fulfilled").length;

    setCopyResult(`Skopiowano ${successCount} zmian.`);
    await loadSchedule();
  };

  const handleSaveTemplate = async () => {
    if (!canManage) return;
    if (!templateName.trim()) {
      setError("Uzupełnij nazwę szablonu.");
      return;
    }
    const from = formatDateKey(weekStart);
    const to = formatDateKey(weekEnd);
    const template = await apiCreateScheduleTemplateFromWeek({
      name: templateName,
      description: templateDescription || undefined,
      from,
      to,
      locationId: selectedLocationId || undefined,
    });
    setTemplates((prev) => [template, ...prev]);
    setTemplateModalOpen(false);
    setTemplateName("");
    setTemplateDescription("");
  };

  const handleApplyTemplate = async () => {
    if (!canManage) return;
    if (!selectedTemplateId) return;
    const template = await apiGetScheduleTemplate(selectedTemplateId);
    const baseDate = weekStart;
    const weekdayMap = {
      MONDAY: 0,
      TUESDAY: 1,
      WEDNESDAY: 2,
      THURSDAY: 3,
      FRIDAY: 4,
      SATURDAY: 5,
      SUNDAY: 6,
    } as const;

    const payloads: ShiftPayload[] = template.shifts.map((shift) => {
      const shiftDate = addDays(baseDate, weekdayMap[shift.weekday]);
      const start = new Date(shiftDate);
      start.setHours(Math.floor(shift.startMinutes / 60), shift.startMinutes % 60, 0, 0);
      const end = new Date(shiftDate);
      end.setHours(Math.floor(shift.endMinutes / 60), shift.endMinutes % 60, 0, 0);
      return {
        employeeId: shift.employeeId,
        locationId: shift.locationId ?? undefined,
        position: shift.position ?? undefined,
        notes: shift.notes ?? undefined,
        color: shift.color ?? undefined,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      };
    });

    const results = await Promise.allSettled(payloads.map((payload) => apiCreateShift(payload)));
    const successCount = results.filter((result) => result.status === "fulfilled").length;
    pushToast({
      title: "Szablon zastosowany",
      description: `Dodano ${successCount} zmian z szablonu.`,
      variant: "success",
    });
    setTemplateApplyOpen(false);
    setSelectedTemplateId("");
    await loadSchedule();
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

  const publishedLabel = isPublished ? "Opublikowany" : "Roboczy";

  if (loading) {
    return (
      <div className="panel-card p-6 text-center text-surface-400">
        Ładowanie grafiku...
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card p-6 text-center text-surface-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-surface-50">Grafik pracy v2</h1>
          <p className="text-sm text-surface-400">
            Układaj zmiany, sprawdzaj dyspozycje i publikuj grafik dla zespołu.
          </p>
        </div>
      </div>

      <ScheduleToolbar
        weekStart={weekStart}
        weekEnd={weekEnd}
        locationId={selectedLocationId}
        locations={locations}
        onLocationChange={setSelectedLocationId}
        onWeekChange={handleWeekChange}
        onPrevWeek={() => setWeekStart((prev) => addDays(prev, -7))}
        onNextWeek={() => setWeekStart((prev) => addDays(prev, 7))}
        onAddShift={() => openShiftModal()}
        onCopyWeek={() => setCopyModalOpen(true)}
        onApplyTemplate={() => setTemplateApplyOpen(true)}
        onSaveTemplate={() => setTemplateModalOpen(true)}
        onPublish={() => setPublishModalOpen(true)}
        onStartTour={() => startScheduleTour({ reset: true })}
        publishedLabel={publishedLabel}
        canManage={canManage}
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
      />

      <ScheduleSummaryPanel
        weekDays={weekDays}
        employees={visibleEmployees}
        shifts={shifts}
        summary={summary}
      />

      <ShiftModal
        open={shiftModalOpen}
        employees={visibleEmployees}
        locations={locations}
        availability={availability}
        leaves={leaves}
        shift={activeShift}
        initialDate={initialShiftDate}
        onClose={() => {
          setShiftModalOpen(false);
          setActiveShift(null);
        }}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
      />

      <Modal
        open={copyModalOpen}
        title="Kopiuj grafik"
        description="Skopiuj zmiany z wybranego zakresu do nowego tygodnia lub dnia."
        onClose={() => {
          setCopyModalOpen(false);
          setCopyResult(null);
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCopyModalOpen(false)}
              className="rounded-xl border border-surface-700/60 bg-surface-900/50 px-4 py-2 text-sm text-surface-200 hover:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleCopySchedule}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-950 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Skopiuj
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="text-sm text-surface-200">
            Tryb kopiowania
            <select
              className="panel-input mt-2 h-11 w-full"
              value={copyMode}
              onChange={(event) => setCopyMode(event.target.value as "week" | "day")}
            >
              <option value="week">Kopiuj cały tydzień</option>
              <option value="day">Kopiuj pojedynczy dzień</option>
            </select>
          </label>
          <label className="text-sm text-surface-200">
            Zakres źródłowy
            <input
              type="date"
              className="panel-input mt-2 h-11 w-full"
              value={copySourceDate}
              onChange={(event) => setCopySourceDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-surface-200">
            Zakres docelowy
            <input
              type="date"
              className="panel-input mt-2 h-11 w-full"
              value={copyTargetDate}
              onChange={(event) => setCopyTargetDate(event.target.value)}
            />
          </label>
          {copyResult && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {copyResult}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={templateModalOpen}
        title="Zapisz tydzień jako szablon"
        description="Nazwij szablon, aby móc ponownie wykorzystać układ zmian."
        onClose={() => setTemplateModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setTemplateModalOpen(false)}
              className="rounded-xl border border-surface-700/60 bg-surface-900/50 px-4 py-2 text-sm text-surface-200 hover:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-950 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Zapisz szablon
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="text-sm text-surface-200">
            Nazwa szablonu
            <input
              type="text"
              className="panel-input mt-2 h-11 w-full"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="np. Sklep centrum"
            />
          </label>
          <label className="text-sm text-surface-200">
            Opis (opcjonalnie)
            <textarea
              className="panel-input mt-2 min-h-[80px] w-full"
              value={templateDescription}
              onChange={(event) => setTemplateDescription(event.target.value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={templateApplyOpen}
        title="Zastosuj szablon grafiku"
        description="Wybierz zapisany szablon i zastosuj go do tego tygodnia."
        onClose={() => setTemplateApplyOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setTemplateApplyOpen(false)}
              className="rounded-xl border border-surface-700/60 bg-surface-900/50 px-4 py-2 text-sm text-surface-200 hover:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-950 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              disabled={!selectedTemplateId}
            >
              Zastosuj
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="text-sm text-surface-200">
            Szablon
            <select
              className="panel-input mt-2 h-11 w-full"
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              <option value="">Wybierz szablon</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

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
              className="rounded-xl border border-surface-700/60 bg-surface-900/50 px-4 py-2 text-sm text-surface-200 hover:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handlePublishSchedule}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-950 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Opublikuj
            </button>
          </>
        }
      >
        <div className="text-sm text-surface-200">
          <p>
            Tydzień: {formatDateKey(weekStart)} – {formatDateKey(weekEnd)}
          </p>
          <p className="mt-2 text-xs text-surface-400">
            Po publikacji wyślemy powiadomienia do pracowników z przypisanymi zmianami.
          </p>
        </div>
      </Modal>
    </div>
  );
}
