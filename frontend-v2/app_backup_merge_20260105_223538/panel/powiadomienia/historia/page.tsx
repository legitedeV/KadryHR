"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotificationCampaign, NotificationCampaignStatus, apiListCampaigns } from "@/lib/api";
import { usePermissions } from "@/lib/use-permissions";

const STATUS_LABELS: Record<NotificationCampaignStatus, string> = {
  DRAFT: "Szkic",
  SENDING: "Wysyłanie",
  SENT: "Wysłano",
  FAILED: "Błąd",
};

const STATUS_COLORS: Record<NotificationCampaignStatus, string> = {
  DRAFT: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  SENDING: "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900",
  SENT: "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900",
  FAILED: "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900",
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CampaignHistoryPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<NotificationCampaignStatus | "">("");

  const canManage = hasPermission("EMPLOYEE_MANAGE");

  const loadCampaigns = useCallback(async () => {
    if (!canManage) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiListCampaigns({
        take: 50,
        status: statusFilter || undefined,
      });
      setCampaigns(response.data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać listy kampanii.");
    } finally {
      setLoading(false);
    }
  }, [canManage, statusFilter]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  if (!canManage) {
    return (
      <div className="space-y-4">
        <div className="card p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nie masz uprawnień do przeglądania historii kampanii.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Powiadomienia
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Historia wysyłek
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wszystkie kampanie: <span className="font-semibold">{campaigns.length}</span>
          </p>
        </div>
        <button
          onClick={() => router.push("/panel/powiadomienia/wyslij")}
          className="btn-primary px-3 py-2 rounded-xl text-xs"
        >
          + Nowa kampania
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-900 dark:text-slate-50">
            Filtruj:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NotificationCampaignStatus | "")}
            className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <option value="">Wszystkie</option>
            <option value="DRAFT">Szkice</option>
            <option value="SENT">Wysłane</option>
            <option value="FAILED">Błędy</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
            {error}
          </p>
        )}

        {loading && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ładowanie kampanii...
          </p>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Brak kampanii do wyświetlenia.
            </p>
            <button
              onClick={() => router.push("/panel/powiadomienia/wyslij")}
              className="mt-3 text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              Utwórz pierwszą kampanię
            </button>
          </div>
        )}

        <div className="space-y-2">
          {campaigns.map((campaign) => {
            const creatorName =
              campaign.createdBy?.firstName && campaign.createdBy?.lastName
                ? `${campaign.createdBy.firstName} ${campaign.createdBy.lastName}`
                : campaign.createdBy?.email || "—";
            const recipientCount = campaign._count?.recipients ?? 0;

            return (
              <div
                key={campaign.id}
                onClick={() => router.push(`/panel/powiadomienia/historia/${campaign.id}`)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full ${
                          STATUS_COLORS[campaign.status]
                        }`}
                      >
                        {STATUS_LABELS[campaign.status]}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(campaign.sentAt || campaign.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {campaign.title}
                    </p>
                    {campaign.body && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        {campaign.body}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Utworzył: {creatorName}</span>
                      {recipientCount > 0 && <span>Odbiorcy: {recipientCount}</span>}
                      <span>Kanały: {campaign.channels.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
