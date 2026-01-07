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
import { EmptyState } from "@/components/EmptyState";

const AVAILABLE_TYPES: NotificationType[] = [
  "TEST",
  "LEAVE_STATUS",
  "SHIFT_ASSIGNMENT",
  "SCHEDULE_PUBLISHED",
  "SWAP_STATUS",
  "CUSTOM",
];

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

// Default preferences if API returns empty or undefined
const getDefaultPreferences = (): NotificationPreference[] =>
  AVAILABLE_TYPES.map((type) => ({
    type,
    inApp: true,
    email: false,
  }));

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
      // Ensure we always have a valid array with all notification types
      if (!prefs || !Array.isArray(prefs) || prefs.length === 0) {
        setPreferences(getDefaultPreferences());
      } else {
        // Merge fetched preferences with defaults to ensure all types are present
        const merged = AVAILABLE_TYPES.map((type) => {
          const existing = prefs.find((p) => p.type === type);
          return existing ?? { type, inApp: true, email: false };
        });
        setPreferences(merged);
      }
    } catch (err) {
      console.error(err);
      // On error, use default preferences instead of showing error
      setPreferences(getDefaultPreferences());
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
    setPreferences((prev) => {
      // Ensure prev is always an array
      const currentPrefs = Array.isArray(prev) ? prev : getDefaultPreferences();
      return currentPrefs.map((pref) =>
        pref.type === type
          ? {
              ...pref,
              [field]: !pref[field],
            }
          : pref,
      );
    });
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await apiUpdateNotificationPreferences(preferences);
      // Handle response safely
      if (updated && Array.isArray(updated)) {
        setPreferences(updated);
      }
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
          <p className="section-label">
            Powiadomienia
          </p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
            Centrum powiadomień
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Nieprzeczytane: <span className="font-semibold text-surface-900 dark:text-surface-100">{unread}</span>
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
                className="btn-secondary px-3 py-2 rounded-xl"
              >
                Historia
              </button>
            </>
          )}
          <button
            className="btn-secondary px-3 py-2 rounded-xl"
            onClick={markAllRead}
            type="button"
            disabled={notifications.length === 0}
          >
            Oznacz wszystkie
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "inbox"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200"
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preferences"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200"
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
              <p className="section-label">
                Inbox
              </p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                Ostatnie powiadomienia
              </p>
            </div>
            <span className="text-[11px] rounded-full border border-surface-200 px-2 py-1 text-surface-600 dark:border-surface-700 dark:text-surface-300">
              Łącznie: {notifications.length}
            </span>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ładowanie powiadomień...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <EmptyState
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
              title="Brak powiadomień"
              description="Gdy pojawią się nowe informacje, zobaczysz je właśnie tutaj."
              action={
                canManage ? (
                  <button
                    onClick={() => router.push("/panel/powiadomienia/wyslij")}
                    className="btn-primary px-4 py-2"
                  >
                    Wyślij pierwsze powiadomienie
                  </button>
                ) : null
              }
            />
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
                  className={`rounded-xl border px-3 py-3 transition-colors ${
                    unreadItem
                      ? "border-brand-200 bg-brand-50/70 dark:border-brand-800/50 dark:bg-brand-950/30"
                      : "border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-surface-500 dark:text-surface-400">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                          {notification.body}
                        </p>
                      )}
                      {notification.data && (
                        <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
                          Szczegóły: {JSON.stringify(notification.data)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {unreadItem ? (
                        <button
                          className="text-[11px] rounded-full border border-brand-200 bg-white px-3 py-1 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:bg-surface-800 dark:text-brand-300 dark:hover:bg-surface-700"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Oznacz jako przeczytane
                        </button>
                      ) : (
                        <span className="text-[11px] text-surface-500 dark:text-surface-400">
                          Przeczytane
                        </span>
                      )}
                      <span className="text-[11px] text-surface-500 dark:text-surface-400">
                        Kanały: {notification.channels?.join(", ") || "Brak"}
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
              <p className="section-label">
                Preferencje
              </p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
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

          <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
            <table className="min-w-full">
              <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Typ powiadomienia
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    W aplikacji
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    E-mail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {preferences.map((pref) => {
                  const meta = TYPE_COPY[pref.type] ?? { label: pref.type, description: "" };
                  return (
                    <tr key={pref.type} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                          {meta.label}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {meta.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={savingPrefs}
                          onClick={() => togglePreference(pref.type, "inApp")}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            pref.inApp ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              pref.inApp ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={savingPrefs}
                          onClick={() => togglePreference(pref.type, "email")}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            pref.email ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              pref.email ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
