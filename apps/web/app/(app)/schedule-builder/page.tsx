"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useToast } from "../../providers";
import { Employee, Shift, deleteShifts, fetchSchedule, upsertShifts } from "./data-client";

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days: string[] = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= count; day++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return days;
}

type SelectionAnchor = { employeeId: string; date: string } | null;

type EditorState = {
  employeeId: string;
  date: string;
  start: string;
  end: string;
  type: string;
  note: string;
  shiftId?: string;
  multi?: boolean;
};

const defaultTypes = ["Dzień", "Noc", "Zdalnie", "Urlop", "Wolne"];

export default function ScheduleBuilderPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<SelectionAnchor>(null);
  const [scale, setScale] = useState(1);
  const router = useRouter();

  const monthKey = useMemo(() => formatMonthKey(cursor), [cursor]);
  const days = useMemo(() => getDaysInMonth(cursor), [cursor]);

  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { session, isReady } = useAuth();
  const orgId = session?.currentOrganization?.id;

  const { data, isPending } = useQuery({
    queryKey: ["schedule", orgId, monthKey],
    queryFn: () => fetchSchedule(orgId!, monthKey),
    enabled: Boolean(orgId),
  });

  const employees = data?.employees ?? [];
  const shifts = data?.shifts ?? [];

  useEffect(() => {
    const recalc = () => {
      const available = window.innerHeight - 140;
      const estimated = 260 + employees.length * 64;
      const nextScale = Math.max(0.75, Math.min(1, available / Math.max(estimated, 1)));
      setScale(nextScale);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [employees.length]);

  useEffect(() => {
    const stopSelecting = () => setSelecting(false);
    window.addEventListener("mouseup", stopSelecting);
    return () => window.removeEventListener("mouseup", stopSelecting);
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: Shift[] | { deleteIds: string[] }) => {
      if (!orgId) throw new Error("Brak organizacji");
      if (Array.isArray(payload)) {
        return upsertShifts(orgId, payload);
      }
      return deleteShifts(orgId, payload.deleteIds);
    },
    onMutate: async (payload) => {
      const key = ["schedule", orgId, monthKey] as const;
      const previous = queryClient.getQueryData<{ employees: Employee[]; shifts: Shift[] }>(key);
      if (!previous) return { previous };

      if (Array.isArray(payload)) {
        const ids = new Set(payload.map((shift) => shift.id));
        const merged = [...previous.shifts.filter((item) => !ids.has(item.id)), ...payload];
        queryClient.setQueryData(key, { ...previous, shifts: merged });
      } else {
        const remaining = previous.shifts.filter((item) => !payload.deleteIds.includes(item.id));
        queryClient.setQueryData(key, { ...previous, shifts: remaining });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["schedule", orgId, monthKey], context.previous);
      }
      pushToast("Błąd synchronizacji. Przywrócono poprzednie dane.", "error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", orgId, monthKey] });
      pushToast("Zapisano zmiany.", "success");
    },
  });

  const activeShift = (employeeId: string, date: string) =>
    shifts.find((shift) => shift.employeeId === employeeId && shift.date === date);

  const handleCellClick = (employeeId: string, date: string) => {
    const shift = activeShift(employeeId, date);
    setEditor({
      employeeId,
      date,
      start: shift?.start ?? "09:00",
      end: shift?.end ?? "17:00",
      type: shift?.type ?? defaultTypes[0],
      note: shift?.note ?? "",
      shiftId: shift?.id,
      multi: false,
    });
  };

  const selectedCellsRange = (target: { employeeId: string; date: string }) => {
    if (!anchor) return [cellKey(target.employeeId, target.date)];
    const empIds = employees.map((emp) => emp.id);
    const startEmp = empIds.indexOf(anchor.employeeId);
    const endEmp = empIds.indexOf(target.employeeId);
    const startIdx = Math.min(startEmp, endEmp);
    const endIdx = Math.max(startEmp, endEmp);

    const startDay = days.indexOf(anchor.date);
    const endDay = days.indexOf(target.date);
    const dayStart = Math.min(startDay, endDay);
    const dayEnd = Math.max(startDay, endDay);

    const keys: string[] = [];
    for (let e = startIdx; e <= endIdx; e++) {
      for (let d = dayStart; d <= dayEnd; d++) {
        keys.push(cellKey(empIds[e], days[d]));
      }
    }
    return keys;
  };

  const handleSelectStart = (employeeId: string, date: string) => {
    setAnchor({ employeeId, date });
    setSelecting(true);
    setSelection(new Set([cellKey(employeeId, date)]));
  };

  const handleSelectEnter = (employeeId: string, date: string) => {
    if (!selecting) return;
    const keys = selectedCellsRange({ employeeId, date });
    setSelection(new Set(keys));
  };

  const handleClearSelection = () => {
    if (!selection.size || !orgId) return;
    const idsToDelete = Array.from(selection)
      .map((key) => {
        const [employeeId, date] = key.split(":");
        return activeShift(employeeId, date)?.id;
      })
      .filter(Boolean) as string[];
    if (!idsToDelete.length) return;

    mutation.mutate({ deleteIds: idsToDelete });
    setSelection(new Set());
  };

  const handleBulkEdit = () => {
    if (!selection.size) return;
    const [first] = Array.from(selection);
    const [employeeId, date] = first.split(":");
    setEditor({
      employeeId,
      date,
      start: "09:00",
      end: "17:00",
      type: defaultTypes[0],
      note: "",
      multi: selection.size > 1,
    });
  };

  const daysShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", { weekday: "short" }).replace(".", "");
  };

  const isWeekend = (dateString: string) => {
    const day = new Date(dateString).getDay();
    return day === 0 || day === 6;
  };

  const gridScaleStyle = {
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  const renderCell = (employee: Employee, date: string) => {
    const shift = activeShift(employee.id, date);
    const key = cellKey(employee.id, date);
    const selected = selection.has(key);
    return (
      <div
        key={key}
        className={`h-16 rounded-lg border transition-colors flex items-center justify-center relative ${selected ? "ring-2 ring-offset-0 ring-[var(--theme-primary)]" : ""}`}
        style={{
          backgroundColor: "var(--surface-secondary)",
          borderColor: selected ? "var(--theme-primary)" : "var(--border-primary)",
        }}
        draggable={Boolean(shift)}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", JSON.stringify(shift));
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const payload = event.dataTransfer.getData("text/plain");
          if (!payload) return;
          const dragged = JSON.parse(payload) as Shift;
          const updated: Shift = {
            ...dragged,
            employeeId: employee.id,
            date,
          };
          mutation.mutate([updated]);
        }}
        onClick={() => handleCellClick(employee.id, date)}
        onMouseDown={() => handleSelectStart(employee.id, date)}
        onMouseEnter={() => handleSelectEnter(employee.id, date)}
      >
        {shift ? (
          <div className="text-xs text-center px-2" style={{ color: "var(--text-primary)" }}>
            <div className="font-semibold" style={{ color: employee.color }}>
              {shift.type}
            </div>
            <div style={{ color: "var(--text-tertiary)" }}>
              {shift.start}–{shift.end}
            </div>
            {shift.note ? (
              <div className="truncate" style={{ color: "var(--text-tertiary)" }}>
                {shift.note}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Brak zmiany
          </span>
        )}
      </div>
    );
  };

  const handleSaveEditor = () => {
    if (!editor || !orgId) return;
    const targetCells = editor.multi && selection.size ? Array.from(selection) : [cellKey(editor.employeeId, editor.date)];
    const updates: Shift[] = targetCells.map((key) => {
      const [employeeId, date] = key.split(":");
      return {
        id: editor.shiftId ?? `shift-${employeeId}-${date}`,
        employeeId,
        date,
        start: editor.start,
        end: editor.end,
        type: editor.type,
        note: editor.note,
      };
    });
    mutation.mutate(updates);
    setEditor(null);
    setSelection(new Set());
  };

  const handleDelete = () => {
    if (!editor?.shiftId || !orgId) return;
    mutation.mutate({ deleteIds: [editor.shiftId] });
    setEditor(null);
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <a
              href="/"
              className="text-sm hover:underline inline-flex items-center mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              ← Powrót
            </a>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Kreator grafików
            </h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Manualny edytor zmian z drag & drop, multi-select oraz zapisem lokalnym dla orgId.
            </p>
          </div>
          <div className="app-card px-4 py-3 text-sm min-w-[240px]">
            {session ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Użytkownik</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {session.user.fullName || session.user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Organizacja</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {session.currentOrganization?.name || "brak"}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Rola: {session.currentOrganization?.role || "brak"} · orgId: {orgId || "-"}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Użyj selektora w nagłówku, aby zmienić kontekst żądania.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Zaloguj się aby edytować grafik
                </div>
                <button
                  className="btn-primary w-full"
                  onClick={() => router.push(`/login?returnUrl=${encodeURIComponent("/schedule-builder")}`)}
                >
                  Przejdź do logowania
                </button>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Dane zapisywane lokalnie per orgId, widoczne natychmiast (optimistic UI).
                </p>
              </div>
            )}
          </div>
        </div>

        {(!session && isReady) ? (
          <div className="app-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
            Wymagane logowanie. Użyj strony logowania i wybierz organizację w nagłówku po uwierzytelnieniu.
          </div>
        ) : null}

        {session ? (
          <div className="app-card p-4 space-y-4" style={{ overflow: "hidden" }}>
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-lg border"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}
                  onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                >
                  ← Poprzedni
                </button>
                <div>
                  <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    {cursor.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {employees.length} pracowników · {days.length} dni
                  </div>
                </div>
                <button
                  className="px-3 py-2 rounded-lg border"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}
                  onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  Następny →
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                  disabled={!selection.size}
                  onClick={handleClearSelection}
                >
                  Wyczyść ({selection.size})
                </button>
                <button
                  className="btn-primary text-sm"
                  disabled={!selection.size}
                  onClick={handleBulkEdit}
                >
                  Ustaw zmianę
                </button>
              </div>
            </div>

            <div className="overflow-hidden" style={{ maxHeight: "calc(100vh - 260px)" }}>
              <div style={gridScaleStyle} className="origin-top-left">
                <div className="border rounded-xl" style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--surface-primary)" }}>
                  <div className="grid" style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(70px, 1fr))` }}>
                    <div className="p-3 border-b border-r" style={{ borderColor: "var(--border-primary)" }}>
                      <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Pracownik</div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Przeciągaj zmiany aby je przenieść</div>
                    </div>
                    {days.map((day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-xs border-b"
                        style={{
                          borderColor: "var(--border-primary)",
                          backgroundColor: isWeekend(day) ? "var(--surface-secondary)" : "var(--surface-primary)",
                          color: isWeekend(day) ? "var(--text-secondary)" : "var(--text-primary)",
                        }}
                      >
                        <div className="font-semibold">{day.split("-")[2]}</div>
                        <div className="uppercase">{daysShort(day)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid scrollbar-hide" style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(70px, 1fr))`, overflowY: "auto" }}>
                    {employees.map((employee) => (
                      <Fragment key={employee.id}>
                        <div
                          className="p-3 border-r border-b flex items-center gap-2"
                          style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--surface-secondary)" }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: employee.color }}
                            aria-hidden
                          />
                          <div>
                            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              {employee.name}
                            </div>
                            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                              {employee.role}
                            </div>
                          </div>
                        </div>
                        {days.map((day) => (
                          <div key={`${employee.id}-${day}`} className="border-b" style={{ borderColor: "var(--border-primary)" }}>
                            {renderCell(employee, day)}
                          </div>
                        ))}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {editor ? (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 px-4">
          <div className="app-card w-full max-w-xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm uppercase" style={{ color: "var(--text-tertiary)" }}>
                  {editor.multi ? `Zbiorcza edycja (${selection.size} komórek)` : "Szczegóły zmiany"}
                </div>
                <h2 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  {editor.date}
                </h2>
              </div>
              <button
                onClick={() => setEditor(null)}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)" }}
              >
                Zamknij
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Start
                </label>
                <input
                  type="time"
                  className="input-primary"
                  value={editor.start}
                  onChange={(e) => setEditor((prev) => prev ? { ...prev, start: e.target.value } : prev)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Koniec
                </label>
                <input
                  type="time"
                  className="input-primary"
                  value={editor.end}
                  onChange={(e) => setEditor((prev) => prev ? { ...prev, end: e.target.value } : prev)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Typ zmiany
                </label>
                <select
                  className="input-primary"
                  value={editor.type}
                  onChange={(e) => setEditor((prev) => prev ? { ...prev, type: e.target.value } : prev)}
                >
                  {defaultTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Notatka
                </label>
                <input
                  className="input-primary"
                  value={editor.note}
                  onChange={(e) => setEditor((prev) => prev ? { ...prev, note: e.target.value } : prev)}
                  placeholder="opcjonalnie"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Zmiany zapisywane lokalnie i synchronizowane po mutacjach. Błędy cofają optymistyczne zmiany.
              </div>
              <div className="flex items-center gap-2">
                {editor.shiftId ? (
                  <button
                    className="px-3 py-2 rounded-lg border"
                    style={{ color: "#b91c1c", borderColor: "#ef4444" }}
                    onClick={handleDelete}
                  >
                    Usuń zmianę
                  </button>
                ) : null}
                <button
                  className="btn-primary"
                  onClick={handleSaveEditor}
                  disabled={mutation.isPending}
                >
                  {editor.multi ? "Zapisz dla zaznaczenia" : "Zapisz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function cellKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}
