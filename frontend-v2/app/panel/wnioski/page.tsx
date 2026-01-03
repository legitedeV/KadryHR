"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  RequestItem,
  RequestStatus,
  RequestType,
  apiCreateLeaveRequest,
  apiListLeaveRequests,
  apiUpdateLeaveStatus,
} from "@/lib/api";
import { formatDateRange } from "@/lib/date-range";
import { usePermissions } from "@/lib/use-permissions";

export default function WnioskiPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  const defaultDate = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<{
    type: RequestType;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl: string;
  }>({
    type: "PAID_LEAVE",
    startDate: defaultDate,
    endDate: defaultDate,
    reason: "",
    attachmentUrl: "",
  });

  useEffect(() => {
    apiListLeaveRequests({ take: 100 })
      .then((response) => {
        setRequests(response.data);
        if (response.data.length > 0) setSelectedId(response.data[0].id);
      })
      .catch((err) => {
        console.error(err);
        setError("Nie udało się pobrać wniosków");
      })
      .finally(() => setLoading(false));
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
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as RequestType }))}
              className="input"
            >
              <option value="PAID_LEAVE">Urlop wypoczynkowy</option>
              <option value="SICK">Chorobowe</option>
              <option value="UNPAID">Urlop bezpłatny</option>
              <option value="OTHER">Inne</option>
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
                      {mapRequestType(r.type)}
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
                    {mapRequestType(selected.type)}
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

function mapRequestType(type: RequestItem["type"]) {
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
