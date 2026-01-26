import { useEffect, useState } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";
export interface ToastPayload {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const listeners = new Set<(toast: ToastPayload) => void>();

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function pushToast(toast: Omit<ToastPayload, "id">) {
  const payload: ToastPayload = { id: randomId(), ...toast };
  listeners.forEach((listener) => listener(payload));
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const listener = (toast: ToastPayload) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4200);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { toasts, dismiss: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)) };
}
