"use client";

import { useEffect } from "react";

type OptionsDrawerProps = {
  open: boolean;
  showLoadBars: boolean;
  showSummaryRow: boolean;
  showWeekendHighlight: boolean;
  showEmployeesWithoutShifts: boolean;
  onClose: () => void;
  onShowLoadBarsChange: (value: boolean) => void;
  onShowSummaryRowChange: (value: boolean) => void;
  onShowWeekendHighlightChange: (value: boolean) => void;
  onShowEmployeesWithoutShiftsChange: (value: boolean) => void;
};

export function OptionsDrawer({
  open,
  showLoadBars,
  showSummaryRow,
  showWeekendHighlight,
  showEmployeesWithoutShifts,
  onClose,
  onShowLoadBarsChange,
  onShowSummaryRowChange,
  onShowWeekendHighlightChange,
  onShowEmployeesWithoutShiftsChange,
}: OptionsDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-surface-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-80 bg-surface-50 shadow-xl border-l border-surface-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-300 px-5 py-4">
            <h2 id="drawer-title" className="text-base font-semibold text-surface-900">
              Opcje grafiku
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
              aria-label="Zamknij"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                  Widoczność elementów
                </p>
              </div>

              {/* Load Bars Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">Obciążenie</p>
                  <p className="text-xs text-surface-600">Pokaż paski obciążenia zespołu</p>
                </div>
                <button
                  type="button"
                  onClick={() => onShowLoadBarsChange(!showLoadBars)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    showLoadBars ? "bg-brand-500" : "bg-surface-300"
                  }`}
                  role="switch"
                  aria-checked={showLoadBars}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-white shadow ring-0 transition ${
                      showLoadBars ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Summary Row Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">Podsumowanie</p>
                  <p className="text-xs text-surface-600">Pokaż wiersz z podsumowaniem</p>
                </div>
                <button
                  type="button"
                  onClick={() => onShowSummaryRowChange(!showSummaryRow)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    showSummaryRow ? "bg-brand-500" : "bg-surface-300"
                  }`}
                  role="switch"
                  aria-checked={showSummaryRow}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-white shadow ring-0 transition ${
                      showSummaryRow ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Weekend Highlight Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">Podświetlenie weekendów</p>
                  <p className="text-xs text-surface-600">Zaznacz soboty i niedziele</p>
                </div>
                <button
                  type="button"
                  onClick={() => onShowWeekendHighlightChange(!showWeekendHighlight)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    showWeekendHighlight ? "bg-brand-500" : "bg-surface-300"
                  }`}
                  role="switch"
                  aria-checked={showWeekendHighlight}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-white shadow ring-0 transition ${
                      showWeekendHighlight ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Show Employees Without Shifts Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">Pracownicy bez zmian</p>
                  <p className="text-xs text-surface-600">Pokaż wszystkich pracowników</p>
                </div>
                <button
                  type="button"
                  onClick={() => onShowEmployeesWithoutShiftsChange(!showEmployeesWithoutShifts)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    showEmployeesWithoutShifts ? "bg-brand-500" : "bg-surface-300"
                  }`}
                  role="switch"
                  aria-checked={showEmployeesWithoutShifts}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-white shadow ring-0 transition ${
                      showEmployeesWithoutShifts ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-surface-300 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Gotowe
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
