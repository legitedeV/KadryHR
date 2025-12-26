"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useToast } from "../../providers";
import { createManualEntry, fetchRecent, fetchReport, fetchStatus, recordEvent, TimeEntryEvent, TimeEntrySource } from "./data-client";
import { Employee } from "../schedule-builder/data-client";

const ACTIONS: { label: string; event: TimeEntryEvent; accent: string; description: string }[] = [
  { label: "Wejście", event: "CLOCK_IN", accent: "#22c55e", description: "Rozpocznij zmianę" },
  { label: "Przerwa", event: "BREAK_START", accent: "#f97316", description: "Oznacz przerwę" },
  { label: "Powrót", event: "BREAK_END", accent: "#06b6d4", description: "Zakończ przerwę" },
  { label: "Wyjście", event: "CLOCK_OUT", accent: "#ef4444", description: "Zakończ zmianę" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function statusLabel(event?: TimeEntryEvent | null) {
  switch (event) {
    case "CLOCK_IN":
      return "Na zmianie";
    case "BREAK_START":
      return "Przerwa";
    case "BREAK_END":
      return "Po przerwie";
    case "CLOCK_OUT":
      return "Po pracy";
    case "MANUAL":
      return "Ręczny wpis";
    default:
      return "Brak zdarzeń";
  }
}

export default function TimeTrackingPage() {
  const { api } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState("");
  const [manual, setManual] = useState({
    startedAt: "",
    endedAt: "",
    note: "",
    location: "",
  });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees", { query: { status: "active" } }),
  });

  useEffect(() => {
    const first = employeesQuery.data?.[0]?.id;
    if (!employeeId && first) {
      setEmployeeId(first);
    }
  }, [employeesQuery.data, employeeId]);

  const statusQuery = useQuery({
    queryKey: ["time-status", employeeId],
    enabled: Boolean(employeeId),
    queryFn: () => fetchStatus(api, employeeId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const reportQuery = useQuery({
    queryKey: ["time-report", employeeId],
    enabled: Boolean(employeeId),
    queryFn: () => fetchReport(api, employeeId, 7),
  });

  const recentQuery = useQuery({
    queryKey: ["time-recent", employeeId],
    enabled: Boolean(employeeId),
    queryFn: () => fetchRecent(api, employeeId),
    refetchInterval: 30_000,
  });

  const actionMutation = useMutation({
    mutationFn: (event: TimeEntryEvent) => recordEvent(api, { employeeId, event, source: "QUICK_ACTION" }),
    onSuccess: () => {
      pushToast("Zaktualizowano ewidencję czasu", "success");
      queryClient.invalidateQueries({ queryKey: ["time-status"] });
      queryClient.invalidateQueries({ queryKey: ["time-recent"] });
      queryClient.invalidateQueries({ queryKey: ["time-report"] });
    },
    onError: (error) => {
      pushToast((error as Error).message || "Nie udało się zapisać zdarzenia", "error");
    },
  });

  const manualMutation = useMutation({
    mutationFn: () =>
      createManualEntry(api, {
        employeeId,
        startedAt: manual.startedAt,
        endedAt: manual.endedAt,
        source: "MANUAL" as TimeEntrySource,
        note: manual.note || undefined,
        location: manual.location || undefined,
      }),
    onSuccess: () => {
      pushToast("Dodano ręczny wpis", "success");
      setManual({ startedAt: "", endedAt: "", note: "", location: "" });
      queryClient.invalidateQueries({ queryKey: ["time-status"] });
      queryClient.invalidateQueries({ queryKey: ["time-recent"] });
      queryClient.invalidateQueries({ queryKey: ["time-report"] });
    },
    onError: (error) => pushToast((error as Error).message || "Nie udało się dodać wpisu", "error"),
  });

  const employees = employeesQuery.data || [];
  const status = statusQuery.data?.status;
  const recent = statusQuery.data?.recent || [];
  const report = reportQuery.data;

  const badgeColor = useMemo(() => {
    if (status?.state === "working") return "#22c55e";
    if (status?.state === "on_break") return "#f97316";
    return "var(--text-tertiary)";
  }, [status?.state]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            /time-tracking
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Rejestracja czasu pracy
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Szybkie akcje, podgląd statusu i ostatnie zdarzenia pracownika.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
            Pracownik
          </label>
          <select
            className="mt-1 rounded-lg border px-3 py-2 text-sm min-w-[220px]"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="" disabled>
              Wybierz pracownika
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Status
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Ostatnie zdarzenie: {statusLabel(status?.lastEvent?.event)}
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--surface-secondary)", color: badgeColor }}>
              {status?.state === "working"
                ? "Pracuje"
                : status?.state === "on_break"
                  ? "Przerwa"
                  : "Poza zmianą"}
            </span>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-primary)" }}>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ostatni wpis
            </div>
            <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {status?.lastEvent ? statusLabel(status.lastEvent.event) : "Brak wpisów"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {status?.lastEvent ? formatDate(status.lastEvent.occurredAt) : "-"}
            </div>
            {status?.lastEvent?.location && (
              <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                Lokalizacja: {status.lastEvent.location}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((action) => (
              <button
                key={action.event}
                className="rounded-lg border px-3 py-3 text-left shadow-sm"
                style={{
                  borderColor: "var(--border-primary)",
                  background: "var(--surface-secondary)",
                  color: "var(--text-primary)",
                  opacity: !employeeId || actionMutation.isPending ? 0.7 : 1,
                }}
                disabled={!employeeId || actionMutation.isPending}
                onClick={() => actionMutation.mutate(action.event)}
              >
                <div className="text-sm font-semibold" style={{ color: action.accent }}>
                  {action.label}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {action.description}
                </div>
              </button>
            ))}
          </div>
          <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}>
            Akcje zapisują zdarzenia w kontekście organizacji i aktualizują bieżący status pracownika.
          </div>
        </div>

        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Ręczny wpis
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Dodaj korektę czasu z konkretnym zakresem.
              </div>
            </div>
            {manualMutation.isSuccess && (
              <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}>
                Zapisano
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Początek
              </label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={manual.startedAt}
                onChange={(e) => setManual((p) => ({ ...p, startedAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Koniec
              </label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={manual.endedAt}
                onChange={(e) => setManual((p) => ({ ...p, endedAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Lokalizacja (opcjonalnie)
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={manual.location}
                onChange={(e) => setManual((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Notatka
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={manual.note}
                onChange={(e) => setManual((p) => ({ ...p, note: e.target.value }))}
                placeholder="np. korekta za wczoraj"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: "var(--theme-primary)",
                color: "white",
                opacity: !employeeId || !manual.startedAt || !manual.endedAt || manualMutation.isPending ? 0.7 : 1,
              }}
              disabled={!employeeId || !manual.startedAt || !manual.endedAt || manualMutation.isPending}
              onClick={() => manualMutation.mutate()}
            >
              {manualMutation.isPending ? "Zapisywanie..." : "Dodaj wpis"}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Raport 7 dni
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Łączny czas pracy i dzienne wpisy.
              </div>
            </div>
            <span className="text-lg font-semibold" style={{ color: "var(--theme-primary)" }}>
              {report ? `${report.totals.hours.toFixed(1)}h` : "--"}
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {report?.daily && report.daily.length > 0 ? (
              report.daily.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
                >
                  <div>
                    <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {day.date}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Ostatnie zdarzenie: {recent?.find((event) => event.occurredAt.startsWith(day.date))?.event || "-"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {(day.minutes / 60).toFixed(1)} h
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Brak danych w wybranym zakresie
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Ostatnie zdarzenia
            </div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Manualne wpisy i akcje szybkie z ostatnich dni.
            </div>
          </div>
          <button
            className="text-sm px-3 py-1 rounded-md border"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
            onClick={() => queryClient.invalidateQueries({ queryKey: ["time-recent"] })}
          >
            Odśwież
          </button>
        </div>
        <div className="space-y-2">
          {recentQuery.data && recentQuery.data.length > 0 ? (
            recentQuery.data.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {statusLabel(item.event)}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {formatDate(item.occurredAt)}
                    {item.location ? ` • ${item.location}` : ""}
                  </div>
                  {item.note && (
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {item.note}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <div>{item.employee?.name || "Pracownik"}</div>
                  <div>{item.recordedBy?.fullName || item.recordedBy?.email || ""}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Brak wpisów
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
