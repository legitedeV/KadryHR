"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotificationItem,
  NotificationPreference,
  NotificationType,
  apiListNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiGetNotificationPreferences,
  apiUpdateNotificationPreferences,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { useNotificationsState } from "@/lib/notifications-context";
import { usePermissions } from "@/lib/use-permissions";

const TYPE_COPY: Record<NotificationType, { label: string; description: string }> = {
  TEST: { label: "Testowe", description: "Szybkie sprawdzenie działania powiadomień." },
  LEAVE_STATUS: {
    label: "Status wniosku",
    description: "Zmiany statusu wniosków urlopowych i absencyjnych.",
  },
  SHIFT_ASSIGNMENT: {
    label: "Grafik / zmiany",
    description: "Powiadomienia związane ze zmianami w grafiku.",
  },
  SCHEDULE_PUBLISHED: {
    label: "Opublikowany grafik",
    description: "Powiadomienia o nowym grafiku.",
  },
  SWAP_STATUS: {
    label: "Status zamiany",
    description: "Powiadomienia o zmianach w zamianach.",
  },
  CUSTOM: {
    label: "Niestandardowe",
    description: "Powiadomienia niestandardowe.",
  },
};

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("pl-PL");
}

type Tab = "inbox" | "preferences";

export default function NotificationsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUnreadCount, refreshUnread } = useNotificationsState();

  const canManage = hasPermission("EMPLOYEE_MANAGE");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiListNotifications({ take: 50 });
      setNotifications(response.data);
      setUnreadCount(response.unreadCount ?? 0);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać powiadomień.");
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await apiGetNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać preferencji powiadomień.");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  const unread = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );

  const togglePreference = (type: NotificationType, field: "inApp" | "email") => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.type === type
          ? {
              ...pref,
              [field]: !pref[field],
            }
          : pref,
      ),
    );
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await apiUpdateNotificationPreferences(preferences);
      setPreferences(updated);
      pushToast({
        title: "Zapisano",
        description: "Twoje preferencje powiadomień zostały zaktualizowane.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać preferencji.",
        variant: "error",
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const updated = await apiMarkNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: updated.readAt ?? null } : n)),
      );
      setUnreadCount(Math.max(0, unread - 1));
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się oznaczyć powiadomienia jako przeczytane.",
        variant: "error",
      });
    }
  };

  const markAllRead = async () => {
    try {
      await apiMarkAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      setUnreadCount(0);
      await refreshUnread();
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się oznaczyć wszystkich jako przeczytane.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Powiadomienia
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Centrum powiadomień
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nieprzeczytane: <span className="font-semibold text-slate-900 dark:text-slate-100">{unread}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {canManage && (
            <>
              <button
                onClick={() => router.push("/panel/powiadomienia/wyslij")}
                className="btn-primary px-3 py-2 rounded-xl"
              >
                Wyślij powiadomienie
              </button>
              <button
                onClick={() => router.push("/panel/powiadomienia/historia")}
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Historia
              </button>
            </>
          )}
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={markAllRead}
            type="button"
            disabled={notifications.length === 0}
          >
            Oznacz wszystkie
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "inbox"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preferences"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Preferencje
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {activeTab === "inbox" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Inbox
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Ostatnie powiadomienia
              </p>
            </div>
            <span className="text-[11px] rounded-full border border-slate-200 px-2 py-1 text-slate-600 dark:border-slate-800 dark:text-slate-300">
              Łącznie: {notifications.length}
            </span>
            </div>

            {loading && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Ładowanie powiadomień...
              </p>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Brak powiadomień do wyświetlenia.
              </div>
            )}

            <div className="space-y-2">
              {notifications.map((notification) => {
                const meta = TYPE_COPY[notification.type] ?? {
                  label: notification.type,
                  description: "",
                };
                const unreadItem = !notification.readAt;
                return (
                  <div
                    key={notification.id}
                    className={`rounded-xl border px-3 py-3 ${
                      unreadItem
                        ? "border-brand-200 bg-brand-50/70 dark:border-slate-700 dark:bg-slate-900/70"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-200">
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {notification.body}
                          </p>
                        )}
                        {notification.data && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Szczegóły: {JSON.stringify(notification.data)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {unreadItem ? (
                          <button
                            className="text-[11px] rounded-full border border-brand-200 bg-white px-3 py-1 text-brand-700 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-brand-200"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Oznacz jako przeczytane
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Przeczytane
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Kanały: {notification.channels.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      )}

      {activeTab === "preferences" && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Preferencje
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Kanały dostarczania
              </p>
            </div>
            <button
              onClick={savePreferences}
              type="button"
              className="btn-primary px-3 py-2 rounded-xl text-xs disabled:opacity-60"
              disabled={savingPrefs}
            >
              {savingPrefs ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>

          <div className="space-y-3">
            {preferences.map((pref) => {
              const meta = TYPE_COPY[pref.type] ?? { label: pref.type, description: "" };
              return (
                <div
                  key={pref.type}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {meta.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {meta.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.inApp}
                            onChange={() => togglePreference(pref.type, "inApp")}
                          />
                          <span>Aplikacja</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.email}
                            onChange={() => togglePreference(pref.type, "email")}
                          />
                          <span>Email</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
