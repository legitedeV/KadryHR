"use client";

import { ReactNode } from "react";
import { ToastPayload, useToastQueue } from "@/lib/toast";

const variantClasses: Record<string, string> = {
  info: "bg-sky-600/10 text-sky-900 border-sky-200 dark:bg-sky-900/50 dark:text-sky-50 dark:border-sky-800",
  success:
    "bg-emerald-600/10 text-emerald-900 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-50 dark:border-emerald-800",
  warning:
    "bg-amber-500/10 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-50 dark:border-amber-800",
  error:
    "bg-rose-500/10 text-rose-900 border-rose-200 dark:bg-rose-900/40 dark:text-rose-50 dark:border-rose-800",
};

function Toast({ toast, dismiss }: { toast: ToastPayload; dismiss: (id: string) => void }) {
  const styles = variantClasses[toast.variant ?? "info"] ?? variantClasses.info;
  return (
    <div
      className={`w-full max-w-sm rounded-2xl border px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur ${styles}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description && <p className="text-xs mt-1 leading-relaxed">{toast.description}</p>}
        </div>
        <button
          onClick={() => dismiss(toast.id)}
          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
          aria-label="Zamknij powiadomienie"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, dismiss } = useToastQueue();

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
