"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-surface-900/55 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg panel-card p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-surface-50">{title}</h2>
            {description && <p className="text-sm text-surface-300">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Zamknij"
            onClick={onClose}
            className="rounded-full border border-surface-700/70 bg-surface-900/70 p-2 text-surface-300 transition hover:text-surface-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 mt-6 border-t border-surface-800/80 bg-surface-900/70 pt-4 backdrop-blur">
            <div className="flex items-center justify-end gap-3">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
