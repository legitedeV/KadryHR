"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  RequestItem,
  RequestStatus,
  RequestType,
  LeaveTypeRecord,
  LEAVE_TYPES,
  apiCreateLeaveRequest,
  apiListLeaveRequests,
  apiListLeaveTypes,
  apiCreateLeaveType,
  apiUpdateLeaveType,
  apiUpdateLeaveStatus,
} from "@/lib/api";
import { formatDateRange } from "@/lib/date-range";
import { usePermissions } from "@/lib/use-permissions";

export default function WnioskiPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  const defaultDate = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<{
    type: RequestType;
    leaveTypeId?: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl: string;
  }>({
    type: "PAID_LEAVE",
    leaveTypeId: undefined,
    startDate: defaultDate,
    endDate: defaultDate,
    reason: "",
    attachmentUrl: "",
  });
  const [newLeaveType, setNewLeaveType] = useState<{
    name: string;
    code: RequestType;
    isPaid: boolean;
    color: string;
  }>({
    name: "",
    code: "OTHER",
    isPaid: true,
    color: "#0ea5e9",
  });
  const [savingLeaveType, setSavingLeaveType] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, requestsRes] = await Promise.all([
          apiListLeaveTypes(),
          apiListLeaveRequests({ take: 100 }),
        ]);
        setLeaveTypes(typesRes);
        setRequests(requestsRes.data);
        if (typesRes.length > 0) {
          const firstActive = typesRes.find((t) => t.isActive);
          if (firstActive) {
            setForm((prev) => ({
              ...prev,
              type: (firstActive.code as RequestType) ?? prev.type,
              leaveTypeId: firstActive.id,
            }));
          }
        }
        if (requestsRes.data.length > 0)
          setSelectedId(requestsRes.data[0].id);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać wniosków");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId]
  );

  const canApprove = hasPermission("LEAVE_APPROVE");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setError("Data zakończenia nie może być wcześniejsza niż początek.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await apiCreateLeaveRequest({
        type: form.type,
        leaveTypeId: form.leaveTypeId,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        reason: form.reason || undefined,
        attachmentUrl: form.attachmentUrl || undefined,
      });
      setRequests((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setForm((prev) => ({
        ...prev,
        reason: "",
        attachmentUrl: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Nie udało się wysłać wniosku");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: RequestStatus) => {
    if (!selected) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateLeaveStatus(selected.id, status);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedId(updated.id);
    } catch (err) {
      console.error(err);
      setError("Nie udało się zaktualizować statusu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateLeaveType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingLeaveType(true);
    setError(null);
    try {
      const created = await apiCreateLeaveType(newLeaveType);
      setLeaveTypes((prev) => [...prev, created]);
      setNewLeaveType({ name: "", code: "OTHER", isPaid: true, color: "#0ea5e9" });
    } catch (err) {
      console.error(err);
      setError("Nie udało się dodać typu urlopu");
    } finally {
      setSavingLeaveType(false);
    }
  };

  const toggleLeaveType = async (id: string, isActive: boolean) => {
    try {
      const updated = await apiUpdateLeaveType(id, { isActive: !isActive });
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? updated : lt)));
    } catch (err) {
      console.error(err);
      setError("Nie udało się zaktualizować typu urlopu");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Wnioski
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Lista wniosków urlopowych i absencyjnych
          </p>
        </div>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
              Typ wniosku
            </label>
            <select
              value={form.leaveTypeId || form.type}
              onChange={(e) => {
                const selected = leaveTypes.find((lt) => lt.id === e.target.value);
                if (selected) {
                  setForm((prev) => ({
                    ...prev,
                    leaveTypeId: selected.id,
                    type: (selected.code as RequestType) ?? prev.type,
                  }));
                } else {
                  setForm((prev) => ({
                    ...prev,
                    leaveTypeId: undefined,
                    type: e.target.value as RequestType,
                  }));
                }
              }}
              className="input"
            >
              {leaveTypes
                .filter((lt) => lt.isActive)
                .map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name}
                  </option>
                ))}
              {leaveTypes.length === 0 &&
                Object.keys(LEAVE_TYPES).map((code) => (
                  <option key={code} value={code}>
                    {mapRequestType(code as RequestType)}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
              Początek
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="input"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
              Koniec
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="input"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
              Powód (opcjonalnie)
            </label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Krótki opis lub link do załącznika"
              className="input"
            />
          </div>
          <div className="md:col-span-5 flex items-center justify-end gap-3">
            <input
              type="url"
              value={form.attachmentUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, attachmentUrl: e.target.value }))}
              placeholder="Link do załącznika (opcjonalnie)"
              className="input flex-1"
            />
            <button
              type="submit"
              className="btn-primary px-4 py-2 rounded-xl text-xs"
              disabled={submitting}
            >
              {submitting ? "Zapisywanie..." : "Wyślij wniosek"}
            </button>
          </div>
        </form>
      </div>

      {canApprove && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                Typy urlopów
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Lista i konfiguracja typów absencji w organizacji
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <form onSubmit={handleCreateLeaveType} className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                  Nazwa
                </label>
                <input
                  className="input"
                  value={newLeaveType.name}
                  onChange={(e) => setNewLeaveType((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Np. Opieka nad dzieckiem"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input"
                  value={newLeaveType.code}
                  onChange={(e) =>
                    setNewLeaveType((prev) => ({ ...prev, code: e.target.value as RequestType }))
                  }
                >
                  {Object.keys(LEAVE_TYPES).map((code) => (
                    <option key={code} value={code}>
                      {mapRequestType(code as RequestType)}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newLeaveType.isPaid}
                    onChange={(e) =>
                      setNewLeaveType((prev) => ({ ...prev, isPaid: e.target.checked }))
                    }
                  />
                  Płatny
                </label>
                <input
                  type="color"
                  className="w-12 h-9 border rounded-md"
                  value={newLeaveType.color}
                  onChange={(e) => setNewLeaveType((prev) => ({ ...prev, color: e.target.value }))}
                  title="Kolor znacznika"
                />
              </div>
              <button
                type="submit"
                className="btn-primary px-4 py-2 rounded-lg"
                disabled={savingLeaveType}
              >
                {savingLeaveType ? "Zapisywanie..." : "Dodaj typ"}
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400">
                    <th className="px-2 py-1">Nazwa</th>
                    <th className="px-2 py-1">Kod</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaveTypes.map((lt) => (
                    <tr key={lt.id}>
                      <td className="px-2 py-1">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: lt.color ?? undefined }}
                          />
                          {lt.name}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-slate-600 dark:text-slate-300">
                        {lt.code ?? "OTHER"}
                      </td>
                      <td className="px-2 py-1">
                        {lt.isActive ? (
                          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800">
                            aktywny
                          </span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700">
                            nieaktywny
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          className="underline text-xs"
                          onClick={() => toggleLeaveType(lt.id, lt.isActive)}
                        >
                          {lt.isActive ? "Dezaktywuj" : "Aktywuj"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leaveTypes.length === 0 && (
                    <tr>
                      <td
                        className="px-2 py-2 text-slate-500 dark:text-slate-400"
                        colSpan={4}
                      >
                        Brak skonfigurowanych typów. Dodaj pierwszy typ urlopu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ładowanie wniosków...
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* lista */}
          <div className="card p-0 lg:col-span-2 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Pracownik
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Typ
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Okres
                  </th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer ${
                      selectedId === r.id
                        ? "bg-brand-50/60 dark:bg-slate-900"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                      {r.employeeName}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {mapRequestType(r.type, r.leaveType?.name)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {formatDateRange(r.startDate, r.endDate)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={statusBadgeClass(r.status)}>
                        {mapStatus(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                    >
                      Brak wniosków do wyświetlenia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* szczegóły */}
          <div className="card p-4">
            {!selected ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wybierz wniosek z listy, aby zobaczyć szczegóły.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    Szczegóły wniosku
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                     {mapRequestType(selected.type, selected.leaveType?.name)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-600 dark:text-slate-300">
                    Pracownik:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {selected.employeeName}
                    </span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Okres: {formatDateRange(selected.startDate, selected.endDate)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Status:{" "}
                    <span className={statusBadgeClass(selected.status)}>
                      {mapStatus(selected.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    Szczegóły / powód
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-slate-200">
                    {selected.reason || "Brak dodatkowych informacji."}
                  </p>
                  {selected.attachmentUrl && (
                    <a
                      className="text-xs text-brand-600 underline"
                      href={selected.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Załącznik
                    </a>
                  )}
                  {selected.rejectionReason && (
                    <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
                      Powód odrzucenia: {selected.rejectionReason}
                    </p>
                  )}
                </div>
                {canApprove && selected.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      className="btn-primary px-3 py-1.5 rounded-lg text-xs"
                      onClick={() => handleStatusChange("APPROVED")}
                      disabled={actionLoading}
                    >
                      Zatwierdź
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-100 dark:bg-rose-950/50"
                      onClick={() => handleStatusChange("REJECTED")}
                      disabled={actionLoading}
                    >
                      Odrzuć
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function mapRequestType(type: RequestItem["type"], customName?: string | null) {
  if (customName) return customName;
  switch (type) {
    case "PAID_LEAVE":
      return "Urlop wypoczynkowy";
    case "SICK":
      return "Chorobowe";
    case "UNPAID":
      return "Urlop bezpłatny";
    case "OTHER":
      return "Inne";
    default:
      return type;
  }
}

function mapStatus(status: RequestItem["status"]) {
  switch (status) {
    case "PENDING":
      return "oczekuje";
    case "APPROVED":
      return "zaakceptowany";
    case "REJECTED":
      return "odrzucony";
    case "CANCELLED":
      return "anulowany";
    default:
      return status;
  }
}

function statusBadgeClass(status: RequestItem["status"]) {
  const base =
    "badge border text-[11px] px-2.5 py-0.5 rounded-full font-medium";
  switch (status) {
    case "PENDING":
      return (
        base +
        " bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800"
      );
    case "APPROVED":
      return (
        base +
        " bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
      );
    case "REJECTED":
      return (
        base +
        " bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800"
      );
    case "CANCELLED":
      return (
        base +
        " bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
      );
    default:
      return base;
  }
}
