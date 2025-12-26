"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useToast } from "../../providers";
import { actOnLeave, fetchLeaves, LeaveFilters, LeaveRequest } from "./data-client";
import { Employee } from "../schedule-builder/data-client";

const statusLabels: Record<LeaveRequest["status"], string> = {
  PENDING: "Oczekuje",
  APPROVED: "Zatwierdzony",
  REJECTED: "Odrzucony",
  CANCELLED: "Anulowany",
};

const typeLabels: Record<LeaveRequest["type"], string> = {
  ANNUAL: "Urlop wypoczynkowy",
  ON_DEMAND: "Urlop na żądanie",
  UNPAID: "Urlop bezpłatny",
  OCCASIONAL: "Urlop okolicznościowy",
  SICK: "Zwolnienie lekarskie",
};

function badgeTone(status: LeaveRequest["status"]) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function LeavesAdminPage() {
  const { api } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeaveFilters>({ status: "all", type: "all" });

  const leavesQuery = useQuery({
    queryKey: ["leaves", filters],
    queryFn: () => fetchLeaves(api, filters),
  });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "approve" | "reject" | "cancel"; note?: string }) =>
      actOnLeave(api, id, action, note ? { note } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      pushToast("Zaktualizowano status wniosku", "success");
    },
    onError: () => pushToast("Nie udało się zmienić statusu", "error"),
  });

  const employeesById = useMemo(() => {
    const map = new Map<string, Employee>();
    employeesQuery.data?.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employeesQuery.data]);

  const leaves = leavesQuery.data || [];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Panel administratora
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Urlopy i nieobecności
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Filtruj, akceptuj i komentuj wnioski urlopowe w obrębie organizacji.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-primary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Status</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["all", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilters((p) => ({ ...p, status: status as LeaveFilters["status"] }))}
                className={`px-3 py-1 rounded-full text-sm border ${filters.status === status ? "bg-theme-gradient text-white" : ""}`}
                style={{ borderColor: "var(--border-primary)", color: filters.status === status ? undefined : "var(--text-secondary)" }}
              >
                {status === "all" ? "Wszystkie" : statusLabels[status as LeaveRequest["status"]]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-primary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Typ wniosku</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["all", "ANNUAL", "ON_DEMAND", "UNPAID", "OCCASIONAL", "SICK"].map((type) => (
              <button
                key={type}
                onClick={() => setFilters((p) => ({ ...p, type: type as LeaveFilters["type"] }))}
                className={`px-3 py-1 rounded-full text-sm border ${filters.type === type ? "bg-theme-gradient text-white" : ""}`}
                style={{ borderColor: "var(--border-primary)", color: filters.type === type ? undefined : "var(--text-secondary)" }}
              >
                {type === "all" ? "Wszystkie" : typeLabels[type as LeaveRequest["type"]]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-primary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Pracownik</div>
          <select
            value={filters.employeeId || ""}
            onChange={(e) => setFilters((p) => ({ ...p, employeeId: e.target.value || undefined }))}
            className="mt-2 rounded-md border px-3 py-2 text-sm w-full"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
          >
            <option value="">Wszyscy</option>
            {employeesQuery.data?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Wnioski urlopowe</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {leaves.length} rekordów
            </div>
          </div>
          {leavesQuery.isLoading && <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Ładowanie...</span>}
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
          {leaves.map((leave) => {
            const employee = leave.employee || employeesById.get(leave.employeeId);
            return (
              <div key={leave.id} className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {employee?.name || "Pracownik"}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeTone(leave.status)}`}>
                      {statusLabels[leave.status]}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {typeLabels[leave.type]} • {formatDateRange(leave.startDate, leave.endDate)}
                  </div>
                  {leave.reason && (
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Powód: {leave.reason}
                    </div>
                  )}
                  {leave.decisionNote && (
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Notatka: {leave.decisionNote}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {leave.status === "PENDING" && (
                    <>
                      <button
                        className="px-3 py-1 text-sm rounded-md border"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                        onClick={() => mutation.mutate({ id: leave.id, action: "approve" })}
                      >
                        Zatwierdź
                      </button>
                      <button
                        className="px-3 py-1 text-sm rounded-md border"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                        onClick={() => mutation.mutate({ id: leave.id, action: "reject" })}
                      >
                        Odrzuć
                      </button>
                      <button
                        className="px-3 py-1 text-sm rounded-md border"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                        onClick={() => mutation.mutate({ id: leave.id, action: "cancel" })}
                      >
                        Anuluj
                      </button>
                    </>
                  )}
                  {leave.status !== "PENDING" && (
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Zmieniono {new Date(leave.createdAt).toLocaleDateString("pl-PL")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {!leaves.length && !leavesQuery.isLoading && (
            <div className="p-6 text-sm text-center" style={{ color: "var(--text-secondary)" }}>
              Brak wniosków w wybranym filtrze.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString("pl-PL")} – ${endDate.toLocaleDateString("pl-PL")}`;
}
