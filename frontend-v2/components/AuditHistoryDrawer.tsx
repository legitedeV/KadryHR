"use client";

import { useEffect, useMemo, useState } from "react";
import { AuditLogRecord, apiGetAuditLogs } from "@/lib/api";
import { pushToast } from "@/lib/toast";

interface AuditHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  entityTypes?: string[];
  actions?: string[];
}

const ACTION_LABELS: Record<string, string> = {
  "grafik.publish": "Publikacja grafiku",
  "grafik.unpublish": "Cofnięcie publikacji grafiku",
  "shift.create": "Utworzenie zmiany",
  "shift.update": "Aktualizacja zmiany",
  "shift.delete": "Usunięcie zmiany",
  "employee.reorder": "Zmiana kolejności pracowników",
  "leave.approve": "Akceptacja urlopu",
  "leave.reject": "Odrzucenie urlopu",
  "rcp.correction.approve": "Akceptacja korekty RCP",
  "rcp.correction.reject": "Odrzucenie korekty RCP",
};

export function AuditHistoryDrawer({ open, onClose, title = "Historia zmian", entityTypes, actions }: AuditHistoryDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AuditLogRecord[]>([]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      try {
        const response = await apiGetAuditLogs({ take: 30, entityTypes, actions });
        setItems(response.data);
      } catch {
        pushToast({ title: "Nie udało się pobrać historii", variant: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, entityTypes, actions]);

  const rows = useMemo(() => items.map((item) => ({
    ...item,
    actionLabel: ACTION_LABELS[item.action] ?? item.action,
    actorName: `${item.actor?.firstName ?? ""} ${item.actor?.lastName ?? ""}`.trim() || "Użytkownik",
  })), [items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Zamknij historię" className="h-full flex-1 cursor-default" onClick={onClose} />
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
          <button type="button" className="panel-button-secondary" onClick={onClose}>Zamknij</button>
        </div>

        {loading && <p className="text-sm text-surface-500">Ładowanie…</p>}
        {!loading && rows.length === 0 && <p className="rounded-lg border border-dashed border-surface-300 p-4 text-sm text-surface-500">Brak wpisów.</p>}

        <ul className="space-y-3">
          {rows.map((item) => (
            <li key={item.id} className="rounded-lg border border-surface-200 p-3">
              <p className="text-sm font-medium text-surface-900">{item.actionLabel}</p>
              <p className="text-xs text-surface-600">{item.actorName} · {new Date(item.createdAt).toLocaleString("pl-PL")}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
