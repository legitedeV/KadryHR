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
        <p className="text-sm font-semibold uppercase tracking-[0.02em] text-surface-400">Grafik</p>
        <p className="text-2xl font-semibold text-surface-50 mt-1">
          Tydzień: {range.label}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-surface-300">
        <span className="panel-pill">
          Łącznie zmian: <strong className="text-surface-100">{shiftsCount}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onPrevWeek} aria-label="Poprzedni tydzień">
            ← Poprzedni
          </button>
          <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onNextWeek} aria-label="Następny tydzień">
            Następny →
          </button>
          <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onPublish}>
            Opublikuj tydzień
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onOpenTemplates} disabled={templatesLoading}>
            {templatesLoading ? "Ładowanie szablonów..." : "Szablony"}
          </button>
          <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onCopyPreviousWeek} disabled={copying}>
            {copying ? "Kopiowanie..." : "Kopiuj tydzień"}
          </button>
          <button
            className="btn-secondary rounded-full px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/50"
            onClick={onClearWeek}
            disabled={shiftsCount === 0}
          >
            Wyczyść tydzień
          </button>
        </div>
      </div>
    </div>
  );
}
