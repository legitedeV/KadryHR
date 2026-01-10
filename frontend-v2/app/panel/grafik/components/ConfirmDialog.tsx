"use client";

import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  open?: boolean;
  forceRender?: boolean;
  portalTarget?: HTMLElement | null;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  onConfirm,
  onCancel,
  open = true,
  forceRender = false,
  portalTarget,
}: ConfirmDialogProps) {
  const shouldRender = forceRender || open;
  if (!shouldRender) return null;

  const dialog = (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-surface-200/80 bg-white p-6 shadow-elevated ring-1 ring-surface-200 dark:border-surface-800 dark:bg-surface-900 dark:ring-surface-700">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">{title}</h2>
          <p className="text-sm text-surface-600 dark:text-surface-300">{description}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} aria-label={cancelLabel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmLabel.toLowerCase().includes("usuń") ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  const target = portalTarget ?? (typeof document !== "undefined" ? document.body : null);
  if (target) {
    return createPortal(dialog, target);
  }

  return dialog;
}
