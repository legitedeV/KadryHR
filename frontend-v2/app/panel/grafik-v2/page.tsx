"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent, KeyboardEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";

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

const employees = [
  {
    id: "emp-1",
    name: "Alicja Wójcik",
    role: "Koordynatorka zmian",
    hours: 168,
    availability: "Dostępna",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=96&h=96",
    suppliers: 12,
    days: 20,
    payout: "7 200 zł",
  },
  {
    id: "emp-2",
    name: "Marek Zieliński",
    role: "Kierownik dostaw",
    hours: 154,
    availability: "Częściowo dostępny",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=96&h=96",
    suppliers: 9,
    days: 18,
    payout: "6 520 zł",
  },
  {
    id: "emp-3",
    name: "Joanna Nowak",
    role: "Specjalistka ds. operacji",
    hours: 176,
    availability: "Dostępna",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=96&h=96",
    suppliers: 15,
    days: 22,
    payout: "7 840 zł",
  },
  {
    id: "emp-4",
    name: "Konrad Lis",
    role: "Magazynier",
    hours: 144,
    availability: "Niedostępny",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=96&h=96",
    suppliers: 6,
    days: 16,
    payout: "5 980 zł",
  },
  {
    id: "emp-5",
    name: "Patrycja Dąbrowska",
    role: "Planistka",
    hours: 162,
    availability: "Dostępna",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=96&h=96",
    suppliers: 11,
    days: 19,
    payout: "6 930 zł",
  },
  {
    id: "emp-6",
    name: "Tomasz Mazur",
    role: "Kierowca",
    hours: 171,
    availability: "Dostępny",
    avatar:
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=facearea&w=96&h=96",
    suppliers: 14,
    days: 21,
    payout: "7 050 zł",
  },
  {
    id: "emp-7",
    name: "Ewelina Kruk",
    role: "Operator zmian",
    hours: 150,
    availability: "Częściowo dostępna",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=96&h=96",
    suppliers: 8,
    days: 17,
    payout: "6 310 zł",
  },
];

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

const initialGrid: Record<string, CellState> = {
  "emp-1-1": {
    value: "08:00-16:00",
    cards: [{ id: "card-1", code: "D", label: "Dostawa", time: "08:00-12:00" }],
  },
  "emp-1-3": {
    value: "",
    cards: [{ id: "card-2", code: "ZM", label: "Zmiana", time: "10:00-18:00" }],
  },
  "emp-2-2": {
    value: "07:00-15:00",
    cards: [{ id: "card-3", code: "D", label: "Dostawa", time: "07:00-11:00" }],
  },
  "emp-2-5": {
    value: "",
    cards: [{ id: "card-4", code: "S", label: "Serwis", time: "12:00-20:00" }],
  },
  "emp-3-4": {
    value: "09:00-17:00",
    cards: [{ id: "card-5", code: "D", label: "Dostawa", time: "09:00-13:00" }],
  },
  "emp-3-8": {
    value: "",
    cards: [{ id: "card-6", code: "N", label: "Nocna", time: "21:00-05:00" }],
  },
  "emp-4-9": {
    value: "06:00-14:00",
    cards: [{ id: "card-7", code: "ZM", label: "Zmiana", time: "06:00-14:00" }],
  },
  "emp-5-12": {
    value: "",
    cards: [{ id: "card-8", code: "D", label: "Dostawa", time: "11:00-15:00" }],
  },
  "emp-6-15": {
    value: "08:00-16:00",
    cards: [{ id: "card-9", code: "W", label: "Wsparcie", time: "08:00-16:00" }],
  },
  "emp-7-18": {
    value: "",
    cards: [{ id: "card-10", code: "D", label: "Dostawa", time: "12:00-16:00" }],
  },
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

function buildKey(employeeId: string, day: number) {
  return `${employeeId}-${day}`;
}

function validateCellValue(value: string) {
  if (!value.trim()) return true;
  const trimmed = value.trim();
  return /^([A-ZĄĆĘŁŃÓŚŹŻ]{1,3}|\d{2}:\d{2}-\d{2}:\d{2})$/i.test(trimmed);
}

export default function GrafikV2Page() {
  const [viewState, setViewState] = useState<ViewState>("loaded");
  const [grid, setGrid] = useState<Record<string, CellState>>(initialGrid);
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
  const cellRefs = useRef(new Map<string, HTMLDivElement | null>());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridData = useMemo(() => {
    const data: Record<string, CellState> = {};
    employees.forEach((employee) => {
      monthDays.forEach((day) => {
        const key = buildKey(employee.id, day.day);
        data[key] = grid[key] ?? { value: "", cards: [] };
      });
    });
    return data;
  }, [grid]);

  const commitChange = useCallback(
    (key: string, next: CellState) => {
      setGrid((prev) => {
        const previous = prev[key] ?? { value: "", cards: [] };
        const updated = { ...prev, [key]: next };
        setHistory((entries) => [...entries, { key, previous, next }]);
        setRedoStack([]);
        return updated;
      });
      setSaveStatus("saving");
      setSaveMessage("Zapisywanie...");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        setSaveStatus("saved");
        setSaveMessage("Zapisano");
      }, 900);
    },
    [setGrid],
  );

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
  }, []);

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
  }, []);

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
    [gridData, handleEditStart, moveFocus, selectedCells],
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
      setGrid((prev) => ({
        ...prev,
        [parsed.key]: nextSource,
        [targetKey]: nextTarget,
      }));
      setSaveStatus("pending");
      setSaveMessage("Zapisz zmiany");
    },
    [gridData],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleUndo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((entries) => entries.slice(0, -1));
    setRedoStack((entries) => [...entries, last]);
    setGrid((prev) => ({ ...prev, [last.key]: last.previous }));
  }, [history]);

  const handleRedo = useCallback(() => {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;
    setRedoStack((entries) => entries.slice(0, -1));
    setHistory((entries) => [...entries, last]);
    setGrid((prev) => ({ ...prev, [last.key]: last.next }));
  }, [redoStack]);

  const saveBadgeClass =
    saveStatus === "saved"
      ? "bg-emerald-100 text-emerald-700"
      : saveStatus === "saving"
        ? "bg-amber-100 text-amber-700"
        : "bg-brand-100 text-brand-700";

  return (
    <div className="panel-page" onMouseUp={handleMouseUp}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-surface-900">Grafik zmian v2</h1>
            <span className="panel-pill">Lipiec 2025</span>
          </div>
          <p className="mt-2 text-sm text-surface-600">
            Widok tabeli kalendarzowej z edycją inline, przeciąganiem zmian i podsumowaniami.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${saveBadgeClass}`} aria-live="polite">
            {saveMessage}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-full border border-surface-200 px-3 py-1 text-xs font-semibold text-surface-600 transition hover:border-surface-300 hover:text-surface-900"
              aria-label="Cofnij"
            >
              Cofnij
            </button>
            <button
              type="button"
              onClick={handleRedo}
              className="rounded-full border border-surface-200 px-3 py-1 text-xs font-semibold text-surface-600 transition hover:border-surface-300 hover:text-surface-900"
              aria-label="Ponów"
            >
              Ponów
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 p-1">
            {(["loaded", "loading", "empty", "error"] as ViewState[]).map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setViewState(state)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  viewState === state
                    ? "bg-surface-900 text-surface-50"
                    : "text-surface-600 hover:text-surface-900"
                }`}
              >
                {state === "loaded"
                  ? "Grafik"
                  : state === "loading"
                    ? "Loading"
                    : state === "empty"
                      ? "Empty"
                      : "Error"}
              </button>
            ))}
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
              <p className="mt-1 text-sm">Sprawdź połączenie lub spróbuj ponownie za chwilę.</p>
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
                    className="sticky left-0 z-10 min-w-[220px] bg-surface-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-surface-500"
                  >
                    Kto?
                  </th>
                  <th
                    colSpan={monthDays.length}
                    className="bg-surface-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-surface-500"
                  >
                    DNI
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500"
                  >
                    Dostawcy
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500"
                  >
                    Dni
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500"
                  >
                    Godziny
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500"
                  >
                    Wypłata
                  </th>
                </tr>
                <tr>
                  {monthDays.map((day) => (
                    <th
                      key={day.day}
                      className={`min-w-[72px] border-b border-surface-200 bg-surface-50 px-2 py-2 text-center text-xs font-semibold text-surface-600 ${
                        day.isHoliday
                          ? "bg-accent-50 text-accent-700"
                          : day.isAlert
                            ? "bg-brand-50 text-brand-700"
                            : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-semibold text-surface-900">{day.day}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{day.weekday}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, rowIndex) => (
                  <tr key={employee.id} className="border-b border-surface-200">
                    <td className="sticky left-0 z-10 min-w-[220px] bg-surface-50 px-4 py-4">
                      <div
                        className="relative flex items-center gap-3"
                        onMouseEnter={() => setActiveProfile(employee.id)}
                        onMouseLeave={() => setActiveProfile(null)}
                      >
                        <Avatar name={employee.name} src={employee.avatar} size="md" className="h-9 w-9" />
                        <div>
                          <p className="text-sm font-semibold text-surface-900">{employee.name}</p>
                          <p className="text-xs text-surface-500">{employee.role}</p>
                        </div>
                        {activeProfile === employee.id && (
                          <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-surface-200 bg-surface-50 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
                            <p className="text-sm font-semibold text-surface-900">{employee.name}</p>
                            <p className="text-xs text-surface-500">{employee.role}</p>
                            <div className="mt-3 space-y-2 text-xs text-surface-600">
                              <div className="flex justify-between">
                                <span>Godziny w miesiącu</span>
                                <span className="font-semibold text-surface-900">{employee.hours}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Dostępność</span>
                                <span className="font-semibold text-brand-700">{employee.availability}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-surface-200 bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-700"
                              aria-label="Edytuj profil"
                            >
                              Edytuj profil
                            </button>
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
                      return (
                        <td key={key} className="border-b border-surface-100">
                          <div
                            ref={(node) => {
                              cellRefs.current.set(key, node);
                            }}
                            role="gridcell"
                            tabIndex={0}
                            aria-label={`Zmiana ${employee.name}, dzień ${day.day}`}
                            aria-invalid={!isValid}
                            onDoubleClick={() => handleEditStart(key)}
                            onKeyDown={(event) => handleKeyNavigation(event, rowIndex, colIndex, key)}
                            onMouseDown={(event) => handleMouseDown(rowIndex, colIndex, key, event.shiftKey)}
                            onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                            onPaste={(event) => handlePaste(event, key)}
                            onDragOver={handleDragOver}
                            onDrop={(event) => handleDrop(event, key)}
                            className={`group relative min-h-[64px] min-w-[72px] cursor-pointer px-2 py-2 text-center align-middle transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                              isSelected ? "bg-brand-50" : "bg-surface-50"
                            } ${!isValid ? "ring-2 ring-accent-400" : ""}`}
                          >
                            {cell.cards.length > 0 && (
                              <div className="flex flex-col gap-1">
                                {cell.cards.map((card) => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    draggable
                                    onDragStart={(event) => handleDragStart(event, key, card.id)}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-surface-200 bg-surface-100 px-2 py-1 text-[11px] font-semibold text-surface-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                                    aria-label={`${card.label} ${card.time}`}
                                  >
                                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700">
                                      {card.code}
                                    </span>
                                    <span className="text-[10px] text-surface-500">{card.time}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {!isEditing && cell.value && (
                              <div className="mt-1 text-[11px] font-semibold text-surface-700">{cell.value}</div>
                            )}
                            {!cell.value && cell.cards.length === 0 && !isEditing && (
                              <div className="text-[11px] text-surface-400">Wpisz kod</div>
                            )}
                            {isEditing && (
                              <div className="absolute inset-1 rounded-xl border border-brand-300 bg-surface-50 p-1">
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
                                  className="h-full w-full rounded-lg border border-surface-200 bg-surface-50 px-2 text-xs font-semibold text-surface-900 outline-none"
                                  aria-label="Edytuj zmianę"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="bg-surface-50 px-3 py-4 text-center text-sm font-semibold text-brand-700">
                      {employee.suppliers}
                    </td>
                    <td className="bg-surface-50 px-3 py-4 text-center text-sm font-semibold text-surface-700">
                      {employee.days}
                    </td>
                    <td className="bg-surface-50 px-3 py-4 text-center text-sm font-semibold text-surface-700">
                      {employee.hours}h
                    </td>
                    <td className="bg-surface-50 px-3 py-4 text-center text-sm font-semibold text-accent-700">
                      {employee.payout}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-surface-600">
            <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1">
              <span className="text-[11px] font-semibold text-surface-500">Legenda dni:</span>
              <span className="text-[11px] font-semibold text-surface-700">ND</span>
              <span className="text-[11px] font-semibold text-surface-700">PO</span>
              <span className="text-[11px] font-semibold text-surface-700">WT</span>
              <span className="text-[11px] font-semibold text-surface-700">ŚR</span>
              <span className="text-[11px] font-semibold text-surface-700">CZ</span>
              <span className="text-[11px] font-semibold text-surface-700">PI</span>
              <span className="text-[11px] font-semibold text-surface-700">SB</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1">
              <span className="text-[11px] font-semibold text-surface-500">Kody zmian:</span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">D</span>
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold text-surface-600">
                ZM
              </span>
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold text-surface-600">
                N
              </span>
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold text-surface-600">
                W
              </span>
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold text-surface-600">
                S
              </span>
              <span className="text-[11px] font-semibold text-surface-500">D = Dostawa</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
