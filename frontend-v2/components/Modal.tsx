"use client";

import { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
  containerClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  variant = "dark",
  containerClassName = "",
  headerClassName = "",
  bodyClassName = "",
  contentClassName = "",
  footerClassName = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!open || !modalRef.current) return;
    const currentModal = modalRef.current;

    const focusable = Array.from(
      currentModal.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      if (focusable.length === 0) return;
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    currentModal.addEventListener("keydown", handleTab);
    return () => {
      currentModal.removeEventListener("keydown", handleTab);
    };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const variantStyles = {
    dark: {
      container: "rounded-2xl border border-surface-700/50 bg-gradient-to-b from-surface-900 to-surface-950 shadow-2xl",
      header: "border-surface-800/60",
      title: "text-surface-50",
      description: "text-surface-400",
      closeButton:
        "border-surface-700/60 bg-surface-800/50 text-surface-400 hover:bg-surface-800 hover:text-surface-100 hover:border-surface-600/60",
      footer: "border-surface-800/60 bg-gradient-to-t from-surface-900 to-transparent",
    },
    light: {
      container: "rounded-2xl border border-surface-200 bg-white shadow-xl",
      header: "border-surface-200",
      title: "text-surface-900",
      description: "text-surface-500",
      closeButton:
        "border-surface-200 bg-white text-surface-400 hover:bg-surface-100 hover:text-surface-700 hover:border-surface-300",
      footer: "border-surface-200 bg-white/95",
    },
  } as const;

  const styles = variantStyles[variant];

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
        ref={modalRef}
        className={`relative z-10 flex max-h-[90vh] w-full flex-col ${sizeClasses[size]} ${styles.container} ${containerClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${styles.header} ${headerClassName}`}>
          <div className="min-w-0 space-y-1.5">
            <h2 id="modal-title" className={`truncate text-lg font-semibold ${styles.title}`}>
              {title}
            </h2>
            {description && (
              <p className={`line-clamp-2 text-sm ${styles.description}`}>{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Zamknij"
            onClick={onClose}
            className={`flex-shrink-0 rounded-xl border p-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${styles.closeButton}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {children && (
          <div className={`flex-1 overflow-y-auto px-6 py-4 ${bodyClassName}`}>
            <div className={`space-y-4 ${contentClassName}`}>{children}</div>
          </div>
        )}
        
        {/* Footer */}
        {footer && (
          <div className={`border-t px-6 py-4 ${styles.footer} ${footerClassName}`}>
            <div className="flex items-center justify-end gap-3">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
