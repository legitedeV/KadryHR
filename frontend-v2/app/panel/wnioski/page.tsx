"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RequestItem,
  RequestType,
  RequestStatus,
  LeaveTypeRecord,
  EmployeeRecord,
  LeaveBalanceInfo,
  LeaveRequestHistoryItem,
  apiListLeaveRequests,
  apiCreateLeaveRequest,
  apiUpdateLeaveRequest,
  apiUpdateLeaveStatus,
  apiListLeaveTypes,
  apiListEmployees,
  apiGetLeaveBalances,
  apiGetLeaveRequestHistory,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { usePermissions } from "@/lib/use-permissions";
import { Modal } from "@/components/Modal";
import { pushToast } from "@/lib/toast";
import { EmptyState } from "@/components/EmptyState";

const LEAVE_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: "PAID_LEAVE", label: "Urlop płatny" },
  { value: "SICK", label: "Chorobowe" },
  { value: "UNPAID", label: "Urlop bezpłatny" },
  { value: "OTHER", label: "Inny" },
];

const STATUS_OPTIONS: { value: RequestStatus | ""; label: string }[] = [
  { value: "", label: "Wszystkie statusy" },
  { value: "PENDING", label: "Oczekujące" },
  { value: "APPROVED", label: "Zatwierdzone" },
  { value: "REJECTED", label: "Odrzucone" },
  { value: "CANCELLED", label: "Anulowane" },
];

function formatDateRange(start: string, end: string) {
  const startLabel = new Date(start).toLocaleDateString("pl-PL");
  const endLabel = new Date(end).toLocaleDateString("pl-PL");
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

function formatDateForInput(date: string) {
  return new Date(date).toISOString().slice(0, 10);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatHistoryAction(action: string) {
  switch (action) {
    case "leave.create":
      return "Utworzono wniosek";
    case "leave.status_change":
      return "Zmiana statusu";
    case "leave.update":
      return "Zaktualizowano wniosek";
    default:
      return action;
  }
}

type FormState = {
  type: RequestType;
  leaveTypeId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  employeeId?: string;
};

const initialFormState: FormState = {
  type: "PAID_LEAVE",
  leaveTypeId: undefined,
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  reason: "",
  employeeId: undefined,
};

type FilterState = {
  status: RequestStatus | "";
  employeeId: string;
  from: string;
  to: string;
};

const initialFilterState: FilterState = {
  status: "",
  employeeId: "",
  from: "",
  to: "",
};

export default function WnioskiPage() {
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("LEAVE_APPROVE") || hasPermission("EMPLOYEE_MANAGE");

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceInfo[]>([]);
  const [history, setHistory] = useState<LeaveRequestHistoryItem[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(
    hasSession ? null : "Zaloguj się, aby zobaczyć wnioski.",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"APPROVED" | "REJECTED" | "CANCELLED" | null>(null);
  const [statusNote, setStatusNote] = useState("");

  // Form state
  const [form, setForm] = useState<FormState>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [showFilters, setShowFilters] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiListLeaveRequests({
        take: 100,
        skip: 0,
        status: filters.status || undefined,
        employeeId: filters.employeeId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      setRequests(response.data);
      if (response.data.length > 0 && !selectedId) {
        setSelectedId(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać wniosków");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedId]);

  const loadLeaveTypes = useCallback(async () => {
    try {
      const types = await apiListLeaveTypes();
      setLeaveTypes(types.filter((t) => t.isActive));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!canManage) return;
    try {
      const response = await apiListEmployees({ take: 100, skip: 0 });
      setEmployees(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [canManage]);

  const loadBalances = useCallback(async () => {
    try {
      const data = await apiGetLeaveBalances({});
      setBalances(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadHistory = useCallback(async (requestId: string) => {
    try {
      const data = await apiGetLeaveRequestHistory(requestId);
      setHistory(data);
    } catch (err) {
      console.error(err);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!hasSession) return;
    loadRequests();
    loadLeaveTypes();
    loadEmployees();
    loadBalances();
  }, [hasSession, loadRequests, loadLeaveTypes, loadEmployees, loadBalances]);

  // Load history when selection changes
  useEffect(() => {
    if (selectedId) {
      loadHistory(selectedId);
    } else {
      setHistory([]);
    }
  }, [selectedId, loadHistory]);

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId],
  );

  const canEditSelected = selected?.status === "PENDING";
  const canCancelSelected = selected?.status === "PENDING";

  const resetForm = () => {
    setForm(initialFormState);
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setForm({
      type: selected.type,
      leaveTypeId: selected.leaveType?.id,
      startDate: formatDateForInput(selected.startDate),
      endDate: formatDateForInput(selected.endDate),
      reason: selected.reason || "",
      employeeId: selected.employeeId,
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const openStatusModal = (action: "APPROVED" | "REJECTED" | "CANCELLED") => {
    setStatusAction(action);
    setStatusNote("");
    setStatusModalOpen(true);
  };

  const validateForm = (): boolean => {
    if (!form.type) {
      setFormError("Wybierz typ wniosku");
      return false;
    }
    if (!form.startDate || !form.endDate) {
      setFormError("Podaj daty rozpoczęcia i zakończenia");
      return false;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setFormError("Data zakończenia musi być po dacie rozpoczęcia");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await apiCreateLeaveRequest({
        type: form.type,
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
        employeeId: canManage ? form.employeeId : undefined,
      });
      setRequests((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCreateModalOpen(false);
      resetForm();
      pushToast({
        title: "Sukces",
        description: "Wniosek został utworzony",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się utworzyć wniosku");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected || !validateForm()) return;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await apiUpdateLeaveRequest(selected.id, {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditModalOpen(false);
      pushToast({
        title: "Sukces",
        description: "Wniosek został zaktualizowany",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się zaktualizować wniosku");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selected || !statusAction) return;
    setSaving(true);
    try {
      const updated = await apiUpdateLeaveStatus(selected.id, statusAction, statusNote || undefined);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setStatusModalOpen(false);
      setStatusAction(null);
      setStatusNote("");
      const actionLabel =
        statusAction === "APPROVED"
          ? "zatwierdzony"
          : statusAction === "REJECTED"
            ? "odrzucony"
            : "anulowany";
      pushToast({
        title: "Sukces",
        description: `Wniosek został ${actionLabel}`,
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu wniosku",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyFilters = () => {
    loadRequests();
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label">Wnioski</p>
          <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
            Lista wniosków pracowników
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="btn-secondary px-2.5 py-1.5 text-sm"
          >
            <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Salda urlopów
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary px-2.5 py-1.5 text-sm"
          >
            <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtry
          </button>
          <button onClick={openCreateModal} className="btn-primary px-2.5 py-1.5 text-sm">
            <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nowy wniosek
          </button>
        </div>
      </div>

      {/* Leave Balances */}
      {showBalances && (
        <div className="card p-3">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">
            Salda urlopowe (rok {new Date().getFullYear()})
          </h3>
          {balances.length === 0 ? (
            <p className="text-sm text-surface-500">Brak danych o saldach.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Pracownik</th>
                    <th>Typ urlopu</th>
                    <th className="text-right">Przysługuje</th>
                    <th className="text-right">Wykorzystano</th>
                    <th className="text-right">Pozostało</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {balances.map((b) => (
                    <tr key={`${b.employeeId}-${b.leaveTypeId}`}>
                      <td className="text-surface-900 dark:text-surface-50">{b.employeeName}</td>
                      <td className="text-surface-700 dark:text-surface-300">{b.leaveTypeName}</td>
                      <td className="text-right text-surface-700 dark:text-surface-300">{b.allocated + b.adjustment} dni</td>
                      <td className="text-right text-surface-700 dark:text-surface-300">{b.used} dni</td>
                      <td className={`text-right font-semibold ${b.remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {b.remaining} dni
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                Status
              </label>
              <select
                className="input text-sm"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as RequestStatus | "" }))}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {canManage && employees.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                  Pracownik
                </label>
                <select
                  className="input text-sm"
                  value={filters.employeeId}
                  onChange={(e) => setFilters((f) => ({ ...f, employeeId: e.target.value }))}
                >
                  <option value="">Wszyscy pracownicy</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {`${emp.firstName} ${emp.lastName}`.trim() || emp.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                Od daty
              </label>
              <input
                type="date"
                className="input text-sm"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                Do daty
              </label>
              <input
                type="date"
                className="input text-sm"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={applyFilters} className="btn-primary px-2.5 py-1.5 text-sm">
              Zastosuj filtry
            </button>
            <button onClick={clearFilters} className="btn-secondary px-2.5 py-1.5 text-sm">
              Wyczyść
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Ładowanie wniosków...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lista */}
          <div className="card lg:col-span-2 overflow-hidden">
            <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                Wnioski ({requests.length})
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="panel-table">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-800">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Pracownik
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Typ
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Zakres dat
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === r.id
                          ? "bg-brand-50/60 dark:bg-brand-950/30"
                          : "hover:bg-surface-50/50 dark:hover:bg-surface-800/50"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 font-semibold text-xs dark:text-surface-300">
                            {r.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-surface-900 dark:text-surface-100">
                            {r.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-surface-600 dark:text-surface-300">
                        {mapRequestType(r.type)}
                      </td>
                      <td className="px-3 py-2 text-sm text-surface-600 dark:text-surface-300">
                        {formatDateRange(r.startDate, r.endDate)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={statusBadgeClass(r.status)}>{mapStatus(r.status)}</span>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        <EmptyState
                          icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          }
                          title="Brak wniosków"
                          description="Gdy pracownicy złożą wnioski, zobaczysz je na tej liście."
                          action={
                            <button onClick={openCreateModal} className="btn-primary px-3 py-2 text-sm">
                              Dodaj pierwszy wniosek
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Szczegóły */}
          <div className="card p-4">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <div className="h-10 w-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Wybierz wniosek z listy, aby zobaczyć szczegóły.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="section-label">Szczegóły wniosku</p>
                    <p className="mt-1 text-base font-bold text-surface-900 dark:text-surface-50">
                      {mapRequestType(selected.type)}
                    </p>
                  </div>
                  <span className={statusBadgeClass(selected.status)}>{mapStatus(selected.status)}</span>
                </div>

                <div className="space-y-2 rounded-xl bg-surface-50/50 dark:bg-surface-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Pracownik</p>
                      <p className="font-semibold text-sm text-surface-900 dark:text-surface-50">{selected.employeeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Data</p>
                      <p className="font-semibold text-sm text-surface-900 dark:text-surface-50">
                        {formatDateRange(selected.startDate, selected.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Utworzono</p>
                      <p className="font-semibold text-sm text-surface-900 dark:text-surface-50">
                        {new Date(selected.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  </div>
                </div>

                {(selected.reason || selected.leaveType?.name) && (
                  <div>
                    <p className="section-label">Powód / szczegóły</p>
                    <p className="mt-1 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                      {selected.reason || selected.leaveType?.name || "Brak dodatkowych informacji."}
                    </p>
                  </div>
                )}

                {selected.rejectionReason && (
                  <div>
                    <p className="section-label">Powód odrzucenia</p>
                    <p className="mt-1 text-sm text-rose-600 dark:text-rose-300 leading-relaxed">
                      {selected.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-surface-200 dark:border-surface-700">
                  {canEditSelected && (
                    <button onClick={openEditModal} className="btn-secondary px-2.5 py-1.5 text-sm">
                      <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edytuj
                    </button>
                  )}
                  {canCancelSelected && (
                    <button
                      onClick={() => openStatusModal("CANCELLED")}
                      className="btn-danger px-3 py-2 text-sm"
                    >
                      <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Anuluj
                    </button>
                  )}
                  {canManage && selected.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => openStatusModal("APPROVED")}
                        className="btn-primary px-3 py-2 text-sm"
                      >
                        <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Zatwierdź
                      </button>
                      <button
                        onClick={() => openStatusModal("REJECTED")}
                        className="btn-danger px-3 py-2 text-sm"
                      >
                        <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Odrzuć
                      </button>
                    </>
                  )}
                </div>

                {/* History */}
                {history.length > 0 && (
                  <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p className="section-label mb-3">Historia zmian</p>
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="flex gap-3 text-sm">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-surface-900 dark:text-surface-50 font-medium">
                              {formatHistoryAction(item.action)}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                              {item.actorName} • {new Date(item.createdAt).toLocaleString("pl-PL")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createModalOpen}
        title="Nowy wniosek"
        description="Wypełnij formularz, aby złożyć nowy wniosek urlopowy."
        onClose={() => setCreateModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? "Zapisywanie..." : "Utwórz"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {canManage && employees.length > 0 && (
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Pracownik</span>
              <select
                className="input mt-1"
                value={form.employeeId || ""}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value || undefined }))}
              >
                <option value="">Wybierz pracownika</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {`${emp.firstName} ${emp.lastName}`.trim() || emp.email}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Typ wniosku</span>
            <select
              className="input mt-1"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RequestType }))}
            >
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {leaveTypes.length > 0 && (
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                Szczegółowy typ urlopu (opcjonalnie)
              </span>
              <select
                className="input mt-1"
                value={form.leaveTypeId || ""}
                onChange={(e) => setForm((f) => ({ ...f, leaveTypeId: e.target.value || undefined }))}
              >
                <option value="">Wybierz</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Data rozpoczęcia</span>
              <input
                type="date"
                className="input mt-1"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Data zakończenia</span>
              <input
                type="date"
                className="input mt-1"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Powód (opcjonalnie)</span>
            <textarea
              className="input mt-1 min-h-[80px]"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Dodatkowe informacje..."
            />
          </label>

          {formError && <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        title="Edytuj wniosek"
        description="Zaktualizuj szczegóły wniosku."
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditModalOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleUpdate} disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Typ wniosku</span>
            <select
              className="input mt-1"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RequestType }))}
            >
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Data rozpoczęcia</span>
              <input
                type="date"
                className="input mt-1"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Data zakończenia</span>
              <input
                type="date"
                className="input mt-1"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Powód (opcjonalnie)</span>
            <textarea
              className="input mt-1 min-h-[80px]"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Dodatkowe informacje..."
            />
          </label>

          {formError && <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>}
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        open={statusModalOpen}
        title={
          statusAction === "APPROVED"
            ? "Zatwierdź wniosek"
            : statusAction === "REJECTED"
              ? "Odrzuć wniosek"
              : "Anuluj wniosek"
        }
        description={
          statusAction === "APPROVED"
            ? "Czy na pewno chcesz zatwierdzić ten wniosek?"
            : statusAction === "REJECTED"
              ? "Podaj powód odrzucenia wniosku."
              : "Czy na pewno chcesz anulować ten wniosek?"
        }
        onClose={() => {
          setStatusModalOpen(false);
          setStatusAction(null);
          setStatusNote("");
        }}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setStatusModalOpen(false);
                setStatusAction(null);
                setStatusNote("");
              }}
            >
              Anuluj
            </button>
            <button
              className={
                statusAction === "APPROVED"
                  ? "btn-primary"
                  : statusAction === "REJECTED" || statusAction === "CANCELLED"
                    ? "btn-danger"
                    : "btn-secondary"
              }
              onClick={handleStatusChange}
              disabled={saving}
            >
              {saving
                ? "Zapisywanie..."
                : statusAction === "APPROVED"
                  ? "Zatwierdź"
                  : statusAction === "REJECTED"
                    ? "Odrzuć"
                    : "Anuluj wniosek"}
            </button>
          </>
        }
      >
        {(statusAction === "REJECTED" || statusAction === "CANCELLED") && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                {statusAction === "REJECTED" ? "Powód odrzucenia" : "Komentarz"} (opcjonalnie)
              </span>
              <textarea
                className="input mt-1 min-h-[80px]"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={statusAction === "REJECTED" ? "Podaj powód odrzucenia..." : "Dodatkowy komentarz..."}
              />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}

function mapRequestType(type: RequestItem["type"]) {
  switch (type) {
    case "PAID_LEAVE":
      return "Urlop płatny";
    case "SICK":
      return "Chorobowe";
    case "UNPAID":
      return "Urlop bezpłatny";
    case "OTHER":
      return "Inny";
    default:
      return type;
  }
}

function mapStatus(status: RequestItem["status"]) {
  switch (status) {
    case "APPROVED":
      return "zatwierdzony";
    case "REJECTED":
      return "odrzucony";
    case "CANCELLED":
      return "anulowany";
    default:
      return "oczekuje";
  }
}

function statusBadgeClass(status: RequestItem["status"]) {
  switch (status) {
    case "APPROVED":
      return "badge badge-success";
    case "REJECTED":
      return "badge badge-error";
    case "CANCELLED":
      return "badge badge-neutral";
    default:
      return "badge badge-warning";
  }
}
