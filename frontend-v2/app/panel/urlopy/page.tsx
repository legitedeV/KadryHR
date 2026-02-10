"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LeaveCategory, LeaveRequestRecord, apiCreateLeaveRequest, apiGetLeaveRequestHistory, apiGetLeaveRequests, apiUpdateLeaveRequestStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pushToast } from "@/lib/toast";
import { AuditHistoryDrawer } from "@/components/AuditHistoryDrawer";

const leaveTypeOptions: Array<{ value: LeaveCategory; label: string }> = [
  { value: "PAID_LEAVE", label: "Wypoczynkowy" },
  { value: "SICK", label: "Chorobowy" },
  { value: "UNPAID", label: "Bezpłatny" },
  { value: "OTHER", label: "Inny" },
];

type TabId = "mine" | "pending" | "history";

export default function UrlopyPage() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "OWNER" || user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState<TabId>("mine");
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<LeaveRequestRecord[]>([]);
  const [pending, setPending] = useState<LeaveRequestRecord[]>([]);
  const [history, setHistory] = useState<LeaveRequestRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<Array<{ id: string; action: string; actorName: string; createdAt: string }>>([]);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<LeaveCategory>("PAID_LEAVE");
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, pendingRes] = await Promise.all([
        apiGetLeaveRequests({ pageSize: 100 }),
        isManager ? apiGetLeaveRequests({ status: "PENDING", pageSize: 100 }) : Promise.resolve({ data: [], total: 0, skip: 0, take: 0 }),
      ]);
      setMine(mineRes.data);
      setPending(pendingRes.data);
      setHistory(mineRes.data.filter((item) => item.status !== "PENDING"));
    } catch {
      pushToast({ title: "Nie udało się pobrać wniosków", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedRequestId) {
      setHistoryItems([]);
      return;
    }
    void (async () => {
      try {
        const result = await apiGetLeaveRequestHistory(selectedRequestId);
        setHistoryItems(result.map((item) => ({ id: item.id, action: item.action, actorName: item.actorName, createdAt: item.createdAt })));
      } catch {
        setHistoryItems([]);
      }
    })();
  }, [selectedRequestId]);

  const handleCreate = useCallback(async () => {
    if (!startDate || !endDate) {
      pushToast({ title: "Uzupełnij daty", variant: "warning" });
      return;
    }
    setCreating(true);
    try {
      await apiCreateLeaveRequest({ startDate, endDate, type, reason: reason || undefined });
      pushToast({ title: "Wniosek wysłany", variant: "success" });
      setReason("");
      setStartDate("");
      setEndDate("");
      await loadData();
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      const code = err?.statusCode;
      pushToast({
        title: code === 409 ? "Konflikt dat" : "Nie udało się utworzyć wniosku",
        description: err?.message,
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  }, [endDate, loadData, reason, startDate, type]);

  const handleDecision = useCallback(
    async (id: string, status: "APPROVED" | "REJECTED") => {
      try {
        await apiUpdateLeaveRequestStatus(id, status);
        pushToast({ title: status === "APPROVED" ? "Wniosek zatwierdzony" : "Wniosek odrzucony", variant: "success" });
        await loadData();
      } catch {
        pushToast({ title: "Nie udało się zaktualizować statusu", variant: "error" });
      }
    },
    [loadData],
  );

  const current = useMemo(() => {
    if (activeTab === "mine") return mine;
    if (activeTab === "pending") return pending;
    return history;
  }, [activeTab, history, mine, pending]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Urlopy</h1>
        <p className="text-sm text-surface-600">Składaj wnioski urlopowe i śledź decyzje.</p>
        {isManager && (
          <button type="button" onClick={() => setAuditDrawerOpen(true)} className="mt-3 panel-button-secondary">Historia zmian</button>
        )}
      </div>

      <section className="rounded-xl border border-surface-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-surface-800">Nowy wniosek</p>
        <div className="grid gap-3 md:grid-cols-4">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="panel-input" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="panel-input" />
          <select value={type} onChange={(e) => setType(e.target.value as LeaveCategory)} className="panel-input">
            {leaveTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={handleCreate} disabled={creating} className="panel-button-primary">
            {creating ? "Zapisywanie..." : "Wyślij wniosek"}
          </button>
        </div>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Powód (opcjonalnie)" className="panel-input mt-3 min-h-20 w-full" />
      </section>

      <section className="rounded-xl border border-surface-200 bg-white p-4">
        <div className="mb-4 flex gap-2">
          <TabButton active={activeTab === "mine"} onClick={() => setActiveTab("mine")}>Moje wnioski</TabButton>
          {isManager && <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>Do akceptacji</TabButton>}
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>Historia</TabButton>
        </div>

        {loading ? <p className="text-sm text-surface-500">Ładowanie…</p> : null}
        {!loading && current.length === 0 ? <p className="rounded-lg border border-dashed border-surface-300 p-4 text-sm text-surface-500">Brak danych w tej sekcji.</p> : null}

        <div className="space-y-3">
          {current.map((item) => (
            <div key={item.id} className="rounded-lg border border-surface-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-surface-800">
                  {item.startDate.slice(0, 10)} → {item.endDate.slice(0, 10)} · {item.leaveType?.name ?? item.type}
                </p>
                <span className="rounded-full bg-surface-100 px-2 py-1 text-xs">{item.status}</span>
              </div>
              {item.employee && <p className="mt-1 text-xs text-surface-500">{item.employee.firstName} {item.employee.lastName}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {activeTab === "pending" && isManager && (
                  <>
                    <button type="button" onClick={() => handleDecision(item.id, "APPROVED")} className="panel-button-primary">Zatwierdź</button>
                    <button type="button" onClick={() => handleDecision(item.id, "REJECTED")} className="panel-button-secondary">Odrzuć</button>
                  </>
                )}
                <button type="button" onClick={() => setSelectedRequestId(item.id)} className="panel-button-secondary">Pokaż historię</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedRequestId && (
        <section className="rounded-xl border border-surface-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold">Historia wniosku</p>
          {historyItems.length === 0 ? (
            <p className="text-sm text-surface-500">Brak wpisów historii.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {historyItems.map((item) => (
                <li key={item.id} className="rounded border border-surface-100 p-2">
                  {item.action} — {item.actorName} ({new Date(item.createdAt).toLocaleString("pl-PL")})
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <AuditHistoryDrawer
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        title="Historia zmian · Urlopy"
        actions={["leave.approve", "leave.reject"]}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm ${active ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-700"}`}
    >
      {children}
    </button>
  );
}
