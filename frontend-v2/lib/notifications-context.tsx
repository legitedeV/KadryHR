"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiGetUnreadNotificationCount } from "./api";

type NotificationsState = {
  unreadCount: number;
  loading: boolean;
  refreshUnread: () => Promise<void>;
  setUnreadCount: (next: number) => void;
};

const NotificationsContext = createContext<NotificationsState | undefined>(undefined);

export function NotificationsProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const { count } = await apiGetUnreadNotificationCount();
      setUnreadCount(count ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refreshUnread();
  }, [enabled, refreshUnread]);

  const value = useMemo(
    () => ({
      unreadCount,
      loading,
      refreshUnread,
      setUnreadCount: (next: number) => setUnreadCount(Math.max(0, next)),
    }),
    [unreadCount, loading, refreshUnread],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsState() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotificationsState must be used within NotificationsProvider");
  }
  return ctx;
}
