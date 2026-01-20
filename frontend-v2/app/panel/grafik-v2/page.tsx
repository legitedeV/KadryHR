"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent, KeyboardEvent, MouseEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { 
  apiListEmployees, 
  apiGetShifts,
  apiListShiftPresets,
  apiListLocations,
  apiCreateShift,
  EmployeeRecord,
  ShiftRecord,
  ShiftPresetRecord,
  LocationRecord,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { formatEmployeeName } from "@/app/panel/grafik/utils";
import { pushToast } from "@/lib/toast";

const weekdayCodes = ["ND", "PO", "WT", "ŚR", "CZ", "PI", "SB"] as const;

const monthDays = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  const date = new Date(2025, 6, day);
  const weekday = weekdayCodes[date.getDay()] ?? "PO";
  return {
    day,
    weekday,
    isHoliday: day === 6 || day === 20,
    isAlert: day === 14,
  };
});

type ShiftCard = {
  id: string;
  code: string;
  label: string;
  time: string;
};

type CellState = {
  value: string;
  cards: ShiftCard[];
};

type HistoryEntry = {
  key: string;
  previous: CellState;
  next: CellState;
};

type ViewState = "loaded" | "loading" | "empty" | "error";

type SaveStatus = "saved" | "saving" | "pending";

type SelectionAnchor = {
  row: number;
  col: number;
};

type ShiftPreset = {
  id: string;
  label: string;
  code: string;
  time: string;
  value: string;
};

function convertShiftPresetToLocal(preset: ShiftPresetRecord): ShiftPreset {
  const startHours = Math.floor(preset.startMinutes / 60);
  const startMins = preset.startMinutes % 60;
  const endHours = Math.floor(preset.endMinutes / 60);
  const endMins = preset.endMinutes % 60;
  const time = `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}-${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  
  return {
    id: preset.id,
    label: preset.name,
    code: preset.code,
    time,
    value: time,
  };
}

function buildKey(employeeId: string, day: number) {
  return `${employeeId}-${day}`;
}

function validateCellValue(value: string) {
  if (!value.trim()) return true;
  const trimmed = value.trim();
  return /^([A-ZĄĆĘŁŃÓŚŹŻ]{1,3}|\d{2}:\d{2}-\d{2}:\d{2})$/i.test(trimmed);
}

function parseTimeRange(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, sh, sm, eh, em] = match;
  const start = Number(sh) * 60 + Number(sm);
  const end = Number(eh) * 60 + Number(em);
  const duration = end >= start ? end - start : 24 * 60 - start + end;
  return Math.max(duration, 0);
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return Math.round(hours * 10) / 10;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildGridFromShifts(
  employees: EmployeeRecord[],
  shifts: ShiftRecord[],
  shiftPresets: ShiftPresetRecord[],
  currentYear: number,
  currentMonth: number
) {
  const grid: Record<string, CellState> = {};
  
  // Build a map of preset codes for lookup
  const presetMap = new Map<string, ShiftPresetRecord>();
  shiftPresets.forEach(preset => {
    presetMap.set(preset.code, preset);
  });
  
  // Process each shift
  shifts.forEach((shift) => {
    const shiftDate = new Date(shift.startsAt);
    const day = shiftDate.getDate();
    const key = buildKey(shift.employeeId, day);
    
    // Parse time from shift
    const startTime = new Date(shift.startsAt);
    const endTime = new Date(shift.endsAt);
    const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}-${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
    
    // Try to match with a preset
    let matchedPreset: ShiftPresetRecord | undefined;
    const shiftStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const shiftEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    
    for (const preset of shiftPresets) {
      if (preset.startMinutes === shiftStartMinutes && preset.endMinutes === shiftEndMinutes) {
        matchedPreset = preset;
        break;
      }
    }
    
    const card: ShiftCard = {
      id: shift.id,
      code: matchedPreset?.code || "?",
      label: matchedPreset?.name || "Zmiana",
      time: timeStr,
    };
    
    if (!grid[key]) {
      grid[key] = {
        value: timeStr,
        cards: [card],
      };
    } else {
      grid[key].cards.push(card);
    }
  });
  
  return grid;
}

export default function GrafikV2Page() {
  const [hasToken] = useState(() => !!getAccessToken());
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [shiftPresets, setShiftPresets] = useState<ShiftPresetRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [errorMessage, setErrorMessage] = useState<string | null>(
    () => (hasToken ? null : "Zaloguj się, aby zobaczyć grafik."),
  );
  const [loading, setLoading] = useState(hasToken);
  const [gridOverrides, setGridOverrides] = useState<Record<string, CellState>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [validationMap, setValidationMap] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveMessage, setSaveMessage] = useState("Zapisano");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [openPresetKey, setOpenPresetKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement | null>());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClick = () => setOpenPresetKey(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!hasToken) return;

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);
    
    // Calculate month range
    const monthDaysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(monthDaysCount).padStart(2, '0')}`;
    
    Promise.all([
      apiListEmployees({ take: 100, skip: 0, status: "active" }),
      apiGetShifts({ from: monthStart, to: monthEnd, locationId: selectedLocationId || undefined }),
      apiListShiftPresets(),
      apiListLocations(),
    ])
      .then(([employeesRes, shiftsRes, presetsRes, locationsRes]) => {
        if (!isMounted) return;
        setEmployees(employeesRes.data);
        setShifts(shiftsRes);
        setShiftPresets(presetsRes);
        setLocations(locationsRes);
      })
      .catch((error) => {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("Nie udało się pobrać danych.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hasToken, currentYear, currentMonth, selectedLocationId]);

  const monthDaysCount = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);
  
  const monthDays = useMemo(() => {
    return Array.from({ length: monthDaysCount }, (_, index) => {
      const day = index + 1;
      const date = new Date(currentYear, currentMonth, day);
      const weekday = weekdayCodes[date.getDay()] ?? "PO";
      return {
        day,
        weekday,
        isHoliday: date.getDay() === 0 || date.getDay() === 6, // Weekend
        isAlert: false,
      };
    });
  }, [currentYear, currentMonth, monthDaysCount]);

  const seededGrid = useMemo(
    () => buildGridFromShifts(employees, shifts, shiftPresets, currentYear, currentMonth),
    [employees, shifts, shiftPresets, currentYear, currentMonth]
  );

  const gridData = useMemo(() => {
    const data: Record<string, CellState> = {};
    employees.forEach((employee) => {
      monthDays.forEach((day) => {
        const key = buildKey(employee.id, day.day);
        data[key] = gridOverrides[key] ?? seededGrid[key] ?? { value: "", cards: [] };
      });
    });
    return data;
  }, [employees, gridOverrides, seededGrid]);

  const employeeSummaries = useMemo(() => {
    const summaries: Record<
      string,
      { suppliers: number; days: number; hours: number; payout: string; availability: string }
    > = {};
    const hourlyRate = 42;

    employees.forEach((employee) => {
      let suppliers = 0;
      let days = 0;
      let minutes = 0;
      monthDays.forEach((day) => {
        const key = buildKey(employee.id, day.day);
        const cell = gridData[key];
        if (!cell) return;
        const hasContent = cell.value.trim() || cell.cards.length > 0;
        if (hasContent) days += 1;

        const valueMinutes = parseTimeRange(cell.value.trim());
        const cardMinutes = cell.cards.reduce((sum, card) => sum + parseTimeRange(card.time), 0);
        minutes += valueMinutes > 0 ? valueMinutes : cardMinutes;

        suppliers += cell.cards.filter((card) => card.code.toUpperCase() === "D").length;
      });

      const hours = formatHours(minutes);
      summaries[employee.id] = {
        suppliers,
        days,
        hours,
        payout: formatCurrency(hours * hourlyRate),
        availability: employee.isActive ? "Dostępny" : "Niedostępny",
      };
    });

    return summaries;
  }, [employees, gridData]);

  const viewState: ViewState = !hasToken
    ? "error"
    : loading
      ? "loading"
      : errorMessage
        ? "error"
        : employees.length > 0
          ? "loaded"
          : "empty";

  const commitChange = useCallback(
    (key: string, next: CellState, options: { autoSave?: boolean } = {}) => {
      setGridOverrides((prev) => {
        const previous = gridData[key] ?? { value: "", cards: [] };
        const updated = { ...prev, [key]: next };
        setHistory((entries) => [...entries, { key, previous, next }]);
        setRedoStack([]);
        return updated;
      });

      if (options.autoSave === false) {
        setSaveStatus("pending");
        setSaveMessage("Zapisz zmiany");
        return;
      }

      setSaveStatus("saving");
      setSaveMessage("Zapisywanie...");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        setSaveStatus("saved");
        setSaveMessage("Zapisano");
      }, 900);
    },
    [gridData],
  );

  const handleManualSave = useCallback(() => {
    setSaveStatus("saving");
    setSaveMessage("Zapisywanie...");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setSaveStatus("saved");
      setSaveMessage("Zapisano");
    }, 900);
  }, []);

  const handleEditStart = useCallback(
    (key: string) => {
      setEditingKey(key);
      setDraftValue(gridData[key]?.value ?? "");
    },
    [gridData],
  );

  const handleEditCommit = useCallback(
    (key: string) => {
      const isValid = validateCellValue(draftValue);
      setValidationMap((prev) => ({ ...prev, [key]: isValid }));
      if (!isValid) return;
      const next: CellState = {
        ...gridData[key],
        value: draftValue.trim(),
      };
      commitChange(key, next);
      setEditingKey(null);
    },
    [commitChange, draftValue, gridData],
  );

  const moveFocus = useCallback((row: number, col: number) => {
    const employee = employees[row];
    const day = monthDays[col];
    if (!employee || !day) return;
    const key = buildKey(employee.id, day.day);
    const node = cellRefs.current.get(key);
    node?.focus();
  }, [employees]);

  const updateSelection = useCallback((start: SelectionAnchor, end: SelectionAnchor) => {
    const next = new Set<string>();
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const key = buildKey(employees[row]!.id, monthDays[col]!.day);
        next.add(key);
      }
    }
    setSelectedCells(next);
  }, [employees]);

  const handleMouseDown = useCallback(
    (row: number, col: number, key: string, shiftKey: boolean) => {
      if (shiftKey && anchor) {
        updateSelection(anchor, { row, col });
      } else {
        setAnchor({ row, col });
        setSelectedCells(new Set([key]));
      }
      setIsSelecting(true);
    },
    [anchor, updateSelection],
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isSelecting || !anchor) return;
      updateSelection(anchor, { row, col });
    },
    [anchor, isSelecting, updateSelection],
  );

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const handleKeyNavigation = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, row: number, col: number, key: string) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleEditStart(key);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const nextCol = event.shiftKey ? col - 1 : col + 1;
        if (nextCol >= 0 && nextCol < monthDays.length) {
          moveFocus(row, nextCol);
        }
        return;
      }
      if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "ArrowRight") moveFocus(row, Math.min(monthDays.length - 1, col + 1));
      if (event.key === "ArrowLeft") moveFocus(row, Math.max(0, col - 1));
      if (event.key === "ArrowDown") moveFocus(Math.min(employees.length - 1, row + 1), col);
      if (event.key === "ArrowUp") moveFocus(Math.max(0, row - 1), col);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        const selected = Array.from(selectedCells);
        if (selected.length === 0) return;
        const payload = selected
          .map((cellKey) => gridData[cellKey]?.value || gridData[cellKey]?.cards.map((card) => card.code).join(", "))
          .join("\t");
        navigator.clipboard.writeText(payload);
      }
    },
    [employees.length, gridData, handleEditStart, moveFocus, selectedCells],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>, key: string) => {
      const text = event.clipboardData.getData("text");
      if (!text) return;
      event.preventDefault();
      const nextValue = text.trim();
      const isValid = validateCellValue(nextValue);
      setValidationMap((prev) => ({ ...prev, [key]: isValid }));
      if (!isValid) return;
      commitChange(key, { ...gridData[key], value: nextValue });
    },
    [commitChange, gridData],
  );

  const handleDragStart = useCallback((event: DragEvent<HTMLButtonElement>, key: string, cardId: string) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({ key, cardId }));
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetKey: string) => {
      event.preventDefault();
      const data = event.dataTransfer.getData("text/plain");
      setDragOverKey(null);
      if (!data) return;
      const parsed = JSON.parse(data) as { key: string; cardId: string };
      if (parsed.key === targetKey) return;
      const sourceCell = gridData[parsed.key];
      const targetCell = gridData[targetKey];
      if (!sourceCell || !targetCell) return;
      const card = sourceCell.cards.find((item) => item.id === parsed.cardId);
      if (!card) return;
      const nextSource: CellState = {
        ...sourceCell,
        cards: sourceCell.cards.filter((item) => item.id !== parsed.cardId),
      };
      const nextTarget: CellState = {
        ...targetCell,
        cards: [...targetCell.cards, card],
      };
      commitChange(parsed.key, nextSource, { autoSave: false });
      commitChange(targetKey, nextTarget, { autoSave: false });
    },
    [commitChange, gridData],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>, key: string) => {
    event.preventDefault();
    setDragOverKey(key);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverKey(null);
  }, []);

  const handleUndo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((entries) => entries.slice(0, -1));
    setRedoStack((entries) => [...entries, last]);
    setGridOverrides((prev) => ({ ...prev, [last.key]: last.previous }));
  }, [history]);

  const handleRedo = useCallback(() => {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;
    setRedoStack((entries) => entries.slice(0, -1));
    setHistory((entries) => [...entries, last]);
    setGridOverrides((prev) => ({ ...prev, [last.key]: last.next }));
  }, [redoStack]);

  const handlePresetApply = useCallback(
    (key: string, preset: ShiftPreset) => {
      const nextCard: ShiftCard = {
        id: `card-${key}-${preset.id}-${Date.now()}`,
        code: preset.code,
        label: preset.label,
        time: preset.time,
      };
      const next: CellState = {
        ...gridData[key],
        value: preset.value,
        cards: [...gridData[key].cards, nextCard],
      };
      commitChange(key, next, { autoSave: false });
      setOpenPresetKey(null);
    },
    [commitChange, gridData],
  );
  
  const localShiftPresets = useMemo(
    () => shiftPresets.map(convertShiftPresetToLocal),
    [shiftPresets]
  );

  const saveBadgeClass =
    saveStatus === "saved"
      ? "bg-surface-100 text-surface-700"
      : saveStatus === "saving"
        ? "bg-brand-100 text-brand-700"
        : "bg-accent-100 text-accent-700";

  return (
    <div className="panel-page" onMouseUp={handleMouseUp}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Grafik zmian v2</h1>
            <span className="panel-pill">
              {new Date(currentYear, currentMonth).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
            Widok tabeli kalendarzowej z edycją inline, przeciąganiem zmian i podsumowaniami.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {locations.length > 0 && (
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="input text-sm"
            >
              <option value="">Wszystkie lokalizacje</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${saveBadgeClass}`} aria-live="polite">
            {saveMessage}
          </div>
          {saveStatus === "pending" && (
            <button
              type="button"
              onClick={handleManualSave}
              className="rounded-full bg-surface-900 dark:bg-surface-50 px-4 py-1.5 text-xs font-semibold text-surface-50 dark:text-surface-900"
            >
              Zapisz
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-full border border-surface-200/80 dark:border-surface-700/80 px-3 py-1 text-xs font-semibold text-surface-600 dark:text-surface-300 transition hover:border-surface-300 hover:text-surface-900 dark:hover:border-surface-600 dark:hover:text-surface-50"
              aria-label="Cofnij"
            >
              Cofnij
            </button>
            <button
              type="button"
              onClick={handleRedo}
              className="rounded-full border border-surface-200/80 dark:border-surface-700/80 px-3 py-1 text-xs font-semibold text-surface-600 dark:text-surface-300 transition hover:border-surface-300 hover:text-surface-900 dark:hover:border-surface-600 dark:hover:text-surface-50"
              aria-label="Ponów"
            >
              Ponów
            </button>
          </div>
        </div>
      </div>

      {viewState === "loading" && (
        <div className="panel-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-surface-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-3 w-40 rounded-full bg-surface-200 animate-pulse" />
              <div className="mt-2 h-3 w-64 rounded-full bg-surface-200 animate-pulse" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, idx) => (
              <div key={idx} className="h-10 rounded-2xl bg-surface-100 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {viewState === "empty" && (
        <div className="panel-card p-6">
          <EmptyState
            title="Brak zaplanowanych zmian"
            description="Dodaj pierwszą zmianę, aby uzupełnić grafik miesiąca."
            action={
              <button
                type="button"
                className="rounded-full bg-surface-900 px-4 py-2 text-sm font-semibold text-surface-50"
              >
                Dodaj zmianę
              </button>
            }
          />
        </div>
      )}

      {viewState === "error" && (
        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6 text-accent-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-accent-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Nie udało się wczytać grafiku.</p>
              <p className="mt-1 text-sm">{errorMessage ?? "Sprawdź połączenie lub spróbuj ponownie."}</p>
            </div>
          </div>
        </div>
      )}

      {viewState === "loaded" && (
        <div className="panel-card p-5">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-10 min-w-[220px] bg-surface-50 dark:bg-surface-900/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400"
                  >
                    Kto?
                  </th>
                  <th
                    colSpan={monthDays.length}
                    className="bg-surface-50 dark:bg-surface-900/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400"
                  >
                    DNI
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 dark:bg-surface-900/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400"
                  >
                    Dostawcy
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 dark:bg-surface-900/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400"
                  >
                    Dni
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 dark:bg-surface-900/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400"
                  >
                    Godziny
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 dark:bg-surface-900/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400"
                  >
                    Wypłata
                  </th>
                </tr>
                <tr>
                  {monthDays.map((day) => (
                    <th
                      key={day.day}
                      className={`min-w-[72px] border-b border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-900/70 px-2 py-2 text-center text-xs font-semibold text-surface-600 dark:text-surface-300 ${
                        day.isHoliday
                          ? "bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400"
                          : day.isAlert
                            ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400"
                            : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">{day.day}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{day.weekday}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, rowIndex) => {
                  const summary = employeeSummaries[employee.id];
                  const employeeName = formatEmployeeName(employee);
                  const employeeRole = employee.position || "Pracownik";
                  const availability = summary?.availability ?? "Dostępny";
                  return (
                    <tr key={employee.id} className="border-b border-surface-200/80 dark:border-surface-700/80">
                      <td className="sticky left-0 z-10 min-w-[220px] bg-surface-50 dark:bg-surface-900/70 px-4 py-4">
                        <div
                          className="relative flex items-center gap-3"
                          onMouseEnter={() => setActiveProfile(employee.id)}
                          onMouseLeave={() => setActiveProfile(null)}
                        >
                          <Avatar name={employeeName} src={employee.avatarUrl ?? undefined} size="md" className="h-9 w-9" />
                          <div>
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{employeeName}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">{employeeRole}</p>
                          </div>
                          {activeProfile === employee.id && (
                            <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-800 p-4 shadow-lg">
                              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{employeeName}</p>
                              <p className="text-xs text-surface-500 dark:text-surface-400">{employeeRole}</p>
                              <div className="mt-3 space-y-2 text-xs text-surface-600 dark:text-surface-300">
                                <div className="flex justify-between">
                                  <span>Godziny w miesiącu</span>
                                  <span className="font-semibold text-surface-900 dark:text-surface-50">{summary?.hours ?? 0}h</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Dostępność</span>
                                  <span className="font-semibold text-brand-700 dark:text-brand-400">{availability}</span>
                                </div>
                              </div>
                              <a
                                href={`/panel/profil?employeeId=${employee.id}`}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-surface-200/80 dark:border-surface-700/80 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-700 dark:text-surface-200"
                                aria-label="Edytuj profil"
                              >
                                Edytuj profil
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      {monthDays.map((day, colIndex) => {
                        const key = buildKey(employee.id, day.day);
                        const cell = gridData[key];
                        const isSelected = selectedCells.has(key);
                        const isEditing = editingKey === key;
                        const isValid = validationMap[key] ?? true;
                        const isPresetOpen = openPresetKey === key;
                        const isDragOver = dragOverKey === key;
                        return (
                          <td key={key} className="border-b border-surface-100 dark:border-surface-800">
                            <div
                              ref={(node) => {
                                cellRefs.current.set(key, node);
                              }}
                              role="gridcell"
                              tabIndex={0}
                              aria-label={`Zmiana ${employeeName}, dzień ${day.day}`}
                              aria-invalid={!isValid}
                              onDoubleClick={() => handleEditStart(key)}
                              onKeyDown={(event) => handleKeyNavigation(event, rowIndex, colIndex, key)}
                              onMouseDown={(event) => handleMouseDown(rowIndex, colIndex, key, event.shiftKey)}
                              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                              onPaste={(event) => handlePaste(event, key)}
                              onDragOver={(event) => handleDragOver(event, key)}
                              onDragLeave={handleDragLeave}
                              onDrop={(event) => handleDrop(event, key)}
                              className={`group relative flex min-h-[64px] min-w-[72px] flex-col justify-center px-2 py-2 text-center align-middle transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                                isSelected ? "bg-brand-50 dark:bg-brand-900/30" : "bg-surface-50 dark:bg-surface-900/50"
                              } ${!isValid ? "ring-2 ring-accent-400" : ""} ${
                                isDragOver ? "ring-2 ring-brand-300" : ""
                              }`}
                            >
                              <button
                                type="button"
                                aria-label="Dodaj zmianę"
                                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                  event.stopPropagation();
                                  setOpenPresetKey((prev) => (prev === key ? null : key));
                                }}
                                className="absolute right-1 top-1 rounded-full border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-800 px-1.5 py-0.5 text-[10px] font-semibold text-surface-500 dark:text-surface-400 opacity-0 transition group-hover:opacity-100"
                              >
                                +
                              </button>
                              {isPresetOpen && (
                                <div
                                  role="menu"
                                  onClick={(event) => event.stopPropagation()}
                                  className="absolute right-1 top-7 z-20 w-40 rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-800 p-2 text-left text-xs text-surface-600 dark:text-surface-300 shadow-lg"
                                >
                                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-surface-400 dark:text-surface-500">
                                    Presety zmian
                                  </p>
                                  {localShiftPresets.map((preset) => (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => handlePresetApply(key, preset)}
                                      className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs font-semibold text-surface-700 dark:text-surface-200 transition hover:bg-surface-100 dark:hover:bg-surface-700"
                                      aria-label={`Dodaj ${preset.label} ${preset.time}`}
                                    >
                                      <span>{preset.label}</span>
                                      <span className="text-[10px] text-surface-500 dark:text-surface-400">{preset.time}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {cell.cards.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  {cell.cards.map((card) => (
                                    <button
                                      key={card.id}
                                      type="button"
                                      draggable
                                      onDragStart={(event) => handleDragStart(event, key, card.id)}
                                      className="flex items-center justify-between gap-2 rounded-xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-100 dark:bg-surface-800 px-2 py-1 text-[11px] font-semibold text-surface-700 dark:text-surface-200 shadow-sm"
                                      aria-label={`${card.label} ${card.time}`}
                                    >
                                      <span className="rounded-full bg-brand-100 dark:bg-brand-900/50 px-2 py-0.5 text-[10px] text-brand-700 dark:text-brand-400">
                                        {card.code}
                                      </span>
                                      <span className="text-[10px] text-surface-500 dark:text-surface-400">{card.time}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {!isEditing && cell.value && (
                                <div className="mt-1 text-[11px] font-semibold text-surface-700 dark:text-surface-200">{cell.value}</div>
                              )}
                              {!cell.value && cell.cards.length === 0 && !isEditing && (
                                <div className="text-[11px] text-surface-400 dark:text-surface-500">Wpisz kod</div>
                              )}
                              {isEditing && (
                                <div className="absolute inset-1 rounded-xl border border-brand-300 bg-surface-50 dark:bg-surface-900 p-1">
                                  <input
                                    autoFocus
                                    value={draftValue}
                                    onChange={(event) => setDraftValue(event.target.value)}
                                    onBlur={() => handleEditCommit(key)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        handleEditCommit(key);
                                      }
                                    }}
                                    className="h-full w-full rounded-lg border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-900 px-2 text-xs font-semibold text-surface-900 dark:text-surface-50 outline-none"
                                    aria-label="Edytuj zmianę"
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="bg-surface-50 dark:bg-surface-900/70 px-3 py-4 text-center text-sm font-semibold text-brand-700 dark:text-brand-400">
                        {summary?.suppliers ?? 0}
                      </td>
                      <td className="bg-surface-50 dark:bg-surface-900/70 px-3 py-4 text-center text-sm font-semibold text-surface-700 dark:text-surface-200">
                        {summary?.days ?? 0}
                      </td>
                      <td className="bg-surface-50 dark:bg-surface-900/70 px-3 py-4 text-center text-sm font-semibold text-surface-700 dark:text-surface-200">
                        {summary?.hours ?? 0}h
                      </td>
                      <td className="bg-surface-50 dark:bg-surface-900/70 px-3 py-4 text-center text-sm font-semibold text-accent-700 dark:text-accent-400">
                        {summary?.payout ?? formatCurrency(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-surface-600 dark:text-surface-300">
            <div className="flex items-center gap-2 rounded-full border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-900/50 px-3 py-1">
              <span className="text-[11px] font-semibold text-surface-500 dark:text-surface-400">Legenda dni:</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">ND</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">PO</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">WT</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">ŚR</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">CZ</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">PI</span>
              <span className="text-[11px] font-semibold text-surface-700 dark:text-surface-200">SB</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-900/50 px-3 py-1">
              <span className="text-[11px] font-semibold text-surface-500 dark:text-surface-400">Kody zmian:</span>
              {localShiftPresets.slice(0, 3).map((preset) => (
                <span key={preset.id} className="rounded-full bg-brand-100 dark:bg-brand-900/50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-400">
                  {preset.code}
                </span>
              ))}
              {localShiftPresets.length > 0 && (
                <span className="text-[11px] font-semibold text-surface-500 dark:text-surface-400">
                  {localShiftPresets.slice(0, 3).map(p => `${p.code} = ${p.label}`).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
