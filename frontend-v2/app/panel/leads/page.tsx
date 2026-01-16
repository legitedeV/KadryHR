"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  fetchLeadAudit,
  fetchLeads,
  LeadAuditEntry,
  LeadItem,
  LeadStatus,
  updateLeadStatus,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

const statusLabels: Record<LeadStatus, string> = {
  NEW: "Nowy",
  QUALIFIED: "Zakwalifikowany",
  CONTACTED: "Skontaktowany",
  WON: "Wygrany",
  LOST: "Utracony",
};

const statusBadgeStyles: Record<LeadStatus, string> = {
  NEW: "badge badge-neutral",
  QUALIFIED: "badge badge-brand",
  CONTACTED: "badge badge-warning",
  WON: "badge badge-success",
  LOST: "badge badge-error",
};

function formatActor(entry: LeadAuditEntry) {
  if (!entry.actor) return "System";
  const name = [entry.actor.firstName, entry.actor.lastName]
    .filter(Boolean)
    .join(" ");
  return name || entry.actor.email;
}

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [auditByLead, setAuditByLead] = useState<Record<string, LeadAuditEntry[]>>({});
  const [auditLoading, setAuditLoading] = useState<Record<string, boolean>>({});
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const canAccess = user?.role === "OWNER" || user?.role === "ADMIN";

  useEffect(() => {
    if (!canAccess) return;

    async function load() {
      setLoading(true);
      try {
        const response = await fetchLeads({
          status: statusFilter || undefined,
          search: search || undefined,
          page,
          pageSize,
        });
        setLeads(response.items);
        setTotal(response.total);
      } catch {
        pushToast({
          title: "Błąd",
          description: "Nie udało się wczytać leadów.",
          variant: "warning",
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [canAccess, page, pageSize, search, statusFilter]);

  useEffect(() => {
    if (page > 1 && leads.length === 0 && !loading) {
      setPage(1);
    }
  }, [leads.length, loading, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [pageSize, total],
  );

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    setUpdatingLeadId(leadId);
    try {
      const updated = await updateLeadStatus(leadId, status);
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? updated : lead)),
      );
      pushToast({
        title: "Status zaktualizowany",
        description: "Lead został oznaczony nowym statusem.",
      });
      setAuditByLead((prev) => ({ ...prev, [leadId]: [] }));
      if (expandedLeadId === leadId) {
        await loadAudit(leadId, true);
      }
    } catch {
      pushToast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu.",
        variant: "warning",
      });
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function loadAudit(leadId: string, force = false) {
    if (!force && auditByLead[leadId]?.length) return;
    setAuditLoading((prev) => ({ ...prev, [leadId]: true }));
    try {
      const logs = await fetchLeadAudit(leadId, { take: 30 });
      setAuditByLead((prev) => ({ ...prev, [leadId]: logs }));
    } catch {
      pushToast({
        title: "Błąd",
        description: "Nie udało się wczytać historii leada.",
        variant: "warning",
      });
    } finally {
      setAuditLoading((prev) => ({ ...prev, [leadId]: false }));
    }
  }

  function toggleAudit(leadId: string) {
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
      return;
    }
    setExpandedLeadId(leadId);
    void loadAudit(leadId);
  }

  if (authLoading) {
    return (
      <div className="card p-6 text-sm text-surface-500">Ładujemy dostęp…</div>
    );
  }

  if (!user) return null;

  if (!canAccess) {
    return (
      <div className="card p-6 space-y-2">
        <p className="section-label">Marketing</p>
        <h1 className="text-base font-bold text-surface-900 dark:text-surface-50">
          Leady demo
        </h1>
        <p className="text-sm text-surface-500">
          Dostęp do leadów demo mają tylko właściciele oraz administratorzy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">Marketing</p>
          <h1 className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
            Leady demo
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Zgłoszenia z formularza „Umów demo” z historią kontaktu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as LeadStatus | "");
              setPage(1);
            }}
            className="input text-sm"
          >
            <option value="">Wszystkie statusy</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Szukaj po e-mailu, nazwie lub firmie"
            className="input text-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Firma</th>
              <th>Status</th>
              <th>Zgody</th>
              <th>Data zgłoszenia</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-surface-500">
                  Ładujemy leady…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-surface-500">
                  Brak leadów dla wybranych filtrów.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <Fragment key={lead.id}>
                  <tr className="border-t border-surface-100 dark:border-surface-800">
                    <td className="py-4">
                      <div className="font-semibold text-surface-900 dark:text-surface-50">
                        {lead.name}
                      </div>
                      <div className="text-xs text-surface-500">{lead.email}</div>
                      {lead.message && (
                        <p className="text-xs text-surface-500 mt-2 line-clamp-2">
                          {lead.message}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="font-medium text-surface-800 dark:text-surface-200">
                        {lead.company}
                      </div>
                      <div className="text-xs text-surface-500">
                        {lead.headcount ? `${lead.headcount} osób` : "Brak danych"}
                      </div>
                      {(lead.utmSource || lead.utmCampaign) && (
                        <div className="text-xs text-surface-500 mt-1">
                          UTM: {lead.utmSource ?? "—"} / {lead.utmCampaign ?? "—"}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={statusBadgeStyles[lead.status]}>
                        {statusLabels[lead.status]}
                      </span>
                      <div className="mt-2">
                        <select
                          value={lead.status}
                          onChange={(event) =>
                            handleStatusChange(lead.id, event.target.value as LeadStatus)
                          }
                          className="input text-xs"
                          disabled={updatingLeadId === lead.id}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="text-xs text-surface-500">
                      <div>Marketing: {lead.consentMarketing ? "Tak" : "Nie"}</div>
                      <div>RODO: {lead.consentPrivacy ? "Tak" : "Nie"}</div>
                    </td>
                    <td className="text-xs text-surface-500">
                      {new Date(lead.createdAt).toLocaleString("pl-PL")}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleAudit(lead.id)}
                        className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                      >
                        {expandedLeadId === lead.id ? "Ukryj historię" : "Pokaż historię"}
                      </button>
                    </td>
                  </tr>
                  {expandedLeadId === lead.id && (
                    <tr>
                      <td colSpan={6} className="bg-surface-50/70 dark:bg-surface-900/40">
                        <div className="px-4 py-4 space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-surface-500">
                            Historia zmian
                          </div>
                          {auditLoading[lead.id] ? (
                            <p className="text-xs text-surface-500">Ładujemy historię…</p>
                          ) : auditByLead[lead.id]?.length ? (
                            <ul className="space-y-2 text-xs text-surface-600 dark:text-surface-300">
                              {auditByLead[lead.id].map((entry) => (
                                <li key={entry.id} className="flex flex-col gap-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-surface-800 dark:text-surface-100">
                                      {entry.action}
                                    </span>
                                    <span>· {formatActor(entry)}</span>
                                    <span>· {new Date(entry.createdAt).toLocaleString("pl-PL")}</span>
                                  </div>
                                  {(entry.before || entry.after) && (
                                    <div className="rounded-lg border border-surface-200/60 dark:border-surface-800/60 bg-white/80 dark:bg-surface-950/60 p-3 text-[11px] whitespace-pre-wrap">
                                      {entry.before && (
                                        <div>Przed: {JSON.stringify(entry.before, null, 2)}</div>
                                      )}
                                      {entry.after && (
                                        <div>Po: {JSON.stringify(entry.after, null, 2)}</div>
                                      )}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-surface-500">
                              Brak zapisanej historii dla tego leada.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-surface-500">
        <div>
          Strona {page} z {totalPages} · {total} zgłoszeń
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-surface-200/60 dark:border-surface-800/60 px-3 py-1 text-xs font-semibold disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Poprzednia
          </button>
          <button
            className="rounded-full border border-surface-200/60 dark:border-surface-800/60 px-3 py-1 text-xs font-semibold disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Następna
          </button>
        </div>
      </div>
    </div>
  );
}
