"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, title, description, onClose, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm transition-opacity" 
        aria-hidden="true" 
        onClick={onClose} 
      />
      
      {/* Modal container */}
      <div 
        className={`relative z-10 w-full ${sizeClasses[size]} rounded-2xl border border-surface-700/50 bg-gradient-to-b from-surface-900 to-surface-950 p-6 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-800/60">
          <div className="space-y-1.5 min-w-0">
            <h2 id="modal-title" className="text-lg font-semibold text-surface-50 truncate">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-surface-400 line-clamp-2">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Zamknij"
            onClick={onClose}
            className="flex-shrink-0 rounded-xl border border-surface-700/60 bg-surface-800/50 p-2 text-surface-400 transition-all hover:bg-surface-800 hover:text-surface-100 hover:border-surface-600/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">{children}</div>
        
        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 pt-4 border-t border-surface-800/60 bg-gradient-to-t from-surface-900 to-transparent -mb-2">
            <div className="flex items-center justify-end gap-3">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
