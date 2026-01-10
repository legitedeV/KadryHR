import type { WeekRange } from "../types";

interface ScheduleHeaderProps {
  range: WeekRange;
  shiftsCount: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPublish: () => void;
  onClearWeek: () => void;
  onCopyPreviousWeek: () => void;
  onOpenTemplates: () => void;
  copying: boolean;
  templatesLoading: boolean;
}

export function ScheduleHeader({
  range,
  shiftsCount,
  onPrevWeek,
  onNextWeek,
  onPublish,
  onClearWeek,
  onCopyPreviousWeek,
  onOpenTemplates,
  copying,
  templatesLoading,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="section-label">Grafik</p>
        <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
          Tydzień: {range.label}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Łącznie zmian: <span className="font-semibold text-surface-900 dark:text-surface-100">{shiftsCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={onPrevWeek} aria-label="Poprzedni tydzień">
            ← Poprzedni
          </button>
          <button className="btn-secondary" onClick={onNextWeek} aria-label="Następny tydzień">
            Następny →
          </button>
        </div>
        <button className="btn-secondary" onClick={onPublish}>
          Opublikuj tydzień
        </button>
        <button className="btn-secondary" onClick={onOpenTemplates} disabled={templatesLoading}>
          {templatesLoading ? "Ładowanie szablonów..." : "Szablony"}
        </button>
        <button className="btn-secondary" onClick={onCopyPreviousWeek} disabled={copying}>
          {copying ? "Kopiowanie..." : "Kopiuj poprzedni tydzień"}
        </button>
        <button
          className="btn-secondary text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/50"
          onClick={onClearWeek}
          disabled={shiftsCount === 0}
        >
          Wyczyść tydzień
        </button>
      </div>
    </div>
  );
}
