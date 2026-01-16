"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiListNotifications, apiMarkNotificationRead, NotificationItem } from "@/lib/api";
import { usePermissions } from "@/lib/use-permissions";

type PopupPosition = { x: number; y: number };

function getInitialPosition(index: number): PopupPosition {
  if (typeof window === "undefined") {
    return { x: 24, y: 24 };
  }
  const width = 340;
  const height = 160;
  const margin = 24;
  const x = Math.max(margin, window.innerWidth - width - margin);
  const y = Math.max(margin, window.innerHeight - height - margin - index * (height + 16));
  return { x, y };
}

function DraggablePopup({
  notification,
  index,
  onDismiss,
}: {
  notification: NotificationItem;
  index: number;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const [position, setPosition] = useState<PopupPosition>(() => getInitialPosition(index));
  const dragRef = useRef<{ offsetX: number; offsetY: number; dragging: boolean }>({
    offsetX: 0,
    offsetY: 0,
    dragging: false,
  });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      setPosition({
        x: Math.max(8, event.clientX - dragRef.current.offsetX),
        y: Math.max(8, event.clientY - dragRef.current.offsetY),
      });
    };
    const handlePointerUp = () => {
      dragRef.current.dragging = false;
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div
      className="fixed z-[60] w-[320px] rounded-2xl border border-surface-800/70 bg-surface-950/90 shadow-xl backdrop-blur"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-800/70 cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          dragRef.current.dragging = true;
          dragRef.current.offsetX = event.clientX - position.x;
          dragRef.current.offsetY = event.clientY - position.y;
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">
          Powiadomienie grafiku
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-surface-400 hover:text-surface-100 text-sm"
          aria-label="Zamknij powiadomienie"
        >
          ×
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-semibold text-surface-100">{notification.title}</p>
        {notification.body && (
          <p className="text-xs text-surface-300 leading-relaxed">{notification.body}</p>
        )}
        <div className="flex items-center justify-between text-[11px] text-surface-500">
          <span>{new Date(notification.createdAt).toLocaleString("pl-PL")}</span>
          <button
            className="text-brand-300 hover:text-brand-200 font-medium"
            onClick={() => router.push("/panel/grafik")}
          >
            Otwórz grafik →
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScheduleNotificationPopups() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("SCHEDULE_MANAGE") || hasPermission("RCP_EDIT");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications],
  );

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [assignments, published] = await Promise.all([
          apiListNotifications({ take: 3, unreadOnly: true, type: "SHIFT_ASSIGNMENT" }),
          apiListNotifications({ take: 3, unreadOnly: true, type: "SCHEDULE_PUBLISHED" }),
        ]);
        if (cancelled) return;
        const combined = [...(assignments.data ?? []), ...(published.data ?? [])];
        setNotifications(combined);
      } catch (error) {
        console.error(error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const handleDismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    try {
      await apiMarkNotificationRead(id);
    } catch (error) {
      console.error(error);
    }
  };

  if (!canManage || sortedNotifications.length === 0) return null;

  return (
    <>
      {sortedNotifications.map((notification, index) => (
        <DraggablePopup
          key={notification.id}
          notification={notification}
          index={index}
          onDismiss={handleDismiss}
        />
      ))}
    </>
  );
}
