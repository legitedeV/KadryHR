"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CampaignDetails,
  NotificationRecipientStatus,
  apiGetCampaignDetails,
} from "@/lib/api";
import { usePermissions } from "@/lib/use-permissions";

const STATUS_LABELS: Record<NotificationRecipientStatus, string> = {
  PENDING: "Oczekujące",
  DELIVERED_IN_APP: "Dostarczone (App)",
  EMAIL_SENT: "Email wysłany",
  EMAIL_FAILED: "Email nieudany",
  SMS_SENT: "SMS wysłany",
  SMS_FAILED: "SMS nieudany",
  SKIPPED: "Pominięte",
};

const STATUS_COLORS: Record<NotificationRecipientStatus, string> = {
  PENDING: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  DELIVERED_IN_APP: "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900",
  EMAIL_SENT: "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900",
  EMAIL_FAILED: "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900",
  SMS_SENT: "text-teal-600 bg-teal-100 dark:text-teal-300 dark:bg-teal-900",
  SMS_FAILED: "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900",
  SKIPPED: "text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900",
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

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("EMPLOYEE_MANAGE");

  useEffect(() => {
    if (!canManage) return;

    const campaignId = params.id as string;
    if (!campaignId) return;

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await apiGetCampaignDetails(campaignId);
        setCampaign(details);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać szczegółów kampanii.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [canManage, params.id]);

  if (!canManage) {
    return (
      <div className="space-y-4">
        <div className="card p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nie masz uprawnień do przeglądania szczegółów kampanii.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ładowanie szczegółów kampanii...
          </p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/panel/powiadomienia/historia")}
          className="text-xs text-brand-600 hover:underline dark:text-brand-400"
        >
          ← Powrót do listy
        </button>
        <div className="card p-6">
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {error || "Nie znaleziono kampanii."}
          </p>
        </div>
      </div>
    );
  }

  const creatorName =
    campaign.createdBy?.firstName && campaign.createdBy?.lastName
      ? `${campaign.createdBy.firstName} ${campaign.createdBy.lastName}`
      : campaign.createdBy?.email || "—";

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push("/panel/powiadomienia/historia")}
        className="text-xs text-brand-600 hover:underline dark:text-brand-400"
      >
        ← Powrót do listy
      </button>

      <div>
        <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
          Szczegóły kampanii
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {campaign.title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Treść</p>
              <p className="text-sm text-slate-900 dark:text-slate-50 mt-1">
                {campaign.body || "(Brak treści)"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Status</p>
                <p className="text-slate-900 dark:text-slate-50 font-medium">{campaign.status}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Typ</p>
                <p className="text-slate-900 dark:text-slate-50 font-medium">{campaign.type}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Utworzył</p>
                <p className="text-slate-900 dark:text-slate-50 font-medium">{creatorName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Data utworzenia</p>
                <p className="text-slate-900 dark:text-slate-50 font-medium">
                  {formatDate(campaign.createdAt)}
                </p>
              </div>
              {campaign.sentAt && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Data wysłania</p>
                  <p className="text-slate-900 dark:text-slate-50 font-medium">
                    {formatDate(campaign.sentAt)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-500 dark:text-slate-400">Kanały</p>
                <p className="text-slate-900 dark:text-slate-50 font-medium">
                  {campaign.channels.join(", ")}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Odbiorcy
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Lista odbiorców ({campaign.recipients.length})
              </p>
            </div>

            {campaign.recipients.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Brak odbiorców.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {campaign.recipients.map((recipient) => {
                  const userName =
                    recipient.user?.firstName && recipient.user?.lastName
                      ? `${recipient.user.firstName} ${recipient.user.lastName}`
                      : recipient.user?.email || "—";

                  return (
                    <div
                      key={recipient.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {userName}
                        </p>
                        {recipient.deliveredInAppAt && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Dostarczone: {formatDate(recipient.deliveredInAppAt)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full ${
                          STATUS_COLORS[recipient.status]
                        }`}
                      >
                        {STATUS_LABELS[recipient.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-3">
              Statystyki dostarczenia
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Łącznie:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  {campaign.stats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-600 dark:text-green-400">Dostarczone (App):</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {campaign.stats.deliveredInApp}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400">Email wysłany:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {campaign.stats.emailSent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-600 dark:text-red-400">Email nieudany:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {campaign.stats.emailFailed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-600 dark:text-orange-400">Pominięte:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {campaign.stats.skipped}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
