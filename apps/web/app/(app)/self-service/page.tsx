"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useToast } from "../../providers";
import { fetchLeaves, LeaveRequest, submitLeave } from "../leaves/data-client";
import { Employee } from "../schedule-builder/data-client";

const typeOptions: { value: LeaveRequest["type"]; label: string }[] = [
  { value: "ANNUAL", label: "Urlop wypoczynkowy" },
  { value: "ON_DEMAND", label: "Urlop na żądanie" },
  { value: "UNPAID", label: "Urlop bezpłatny" },
  { value: "OCCASIONAL", label: "Urlop okolicznościowy" },
  { value: "SICK", label: "Zwolnienie lekarskie" },
];

const statusLabels: Record<LeaveRequest["status"], string> = {
  PENDING: "Oczekuje",
  APPROVED: "Zatwierdzony",
  REJECTED: "Odrzucony",
  CANCELLED: "Anulowany",
};

export default function SelfServicePage() {
  const { api } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeId: "",
    type: typeOptions[0].value,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  });

  const leavesQuery = useQuery({
    queryKey: ["my-leaves", form.employeeId],
    enabled: Boolean(form.employeeId),
    queryFn: () => fetchLeaves(api, { employeeId: form.employeeId }),
  });

  const mutation = useMutation({
    mutationFn: () => submitLeave(api, form),
    onSuccess: () => {
      pushToast("Wniosek został wysłany", "success");
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      setForm((p) => ({ ...p, reason: "" }));
    },
    onError: () => pushToast("Nie udało się złożyć wniosku", "error"),
  });

  const employees = employeesQuery.data || [];
  useEffect(() => {
    if (!form.employeeId && employees[0]?.id) {
      setForm((prev) => ({ ...prev, employeeId: employees[0].id }));
    }
  }, [employees, form.employeeId]);

  const myLeaves = leavesQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Panel pracownika
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Wnioski urlopowe i zamiany
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Zgłaszaj własne urlopy, śledź statusy i monitoruj ostatnie decyzje.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="col-span-2 rounded-xl border p-5"
          style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Wniosek urlopowy
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Wybierz pracownika, zakres dat i powód nieobecności.
              </div>
            </div>
            {mutation.isSuccess && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "var(--surface-tertiary)", color: "var(--text-secondary)" }}
              >
                Wysłano
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Pracownik
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={form.employeeId}
                onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
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

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Typ urlopu
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as LeaveRequest["type"] }))}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Data od
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Data do
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Powód (opcjonalnie)
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Dodaj dodatkowy komentarz"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: "var(--theme-primary)",
                color: "white",
                opacity: !canSubmit(form) || mutation.isPending ? 0.7 : 1,
              }}
              disabled={!canSubmit(form) || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Wysyłanie..." : "Złóż wniosek"}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Statusy i zamiany
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Monitoruj ostatnie decyzje i poproś o zamianę zmiany, jeśli urlop został zaakceptowany.
            </p>
          </div>
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              Ostatnie wnioski
            </div>
            <div className="mt-2 space-y-2">
              {myLeaves.map((leave) => (
                <div key={leave.id} className="rounded-md border px-3 py-2" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {typeOptions.find((option) => option.value === leave.type)?.label || leave.type}
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--surface-tertiary)", color: "var(--text-secondary)" }}
                    >
                      {statusLabels[leave.status]}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </div>
                  {leave.reason && (
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Powód: {leave.reason}
                    </div>
                  )}
                </div>
              ))}

              {!myLeaves.length && (
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Brak zgłoszonych wniosków. Dodaj pierwszy urlop, aby zobaczyć status.
                </div>
              )}
            </div>
          </div>

          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              Podpowiedź
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Po zatwierdzeniu urlopu możesz poprosić kolegów o zamianę zmiany w grafiku lub dodać notatkę dla menedżera.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function canSubmit(form: { employeeId: string; startDate: string; endDate: string }) {
  return Boolean(form.employeeId && form.startDate && form.endDate);
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString("pl-PL")} – ${endDate.toLocaleDateString("pl-PL")}`;
}
