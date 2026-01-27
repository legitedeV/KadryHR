import type { LocationRecord } from "@/lib/api";
import type { WeekRange } from "../types";

interface ScheduleHeaderProps {
  range: WeekRange;
  shiftsCount: number;
  locations: LocationRecord[];
  selectedLocationId: string;
  canManage: boolean;
  title?: string;
  scopeLabel?: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onPublish: () => void;
  onClearWeek: () => void;
  onCopyPreviousWeek: () => void;
  onOpenTemplates: () => void;
  onAddShift: () => void;
  onLocationChange: (locationId: string) => void;
  copying: boolean;
  templatesLoading: boolean;
}

export function ScheduleHeader({
  range,
  shiftsCount,
  locations,
  selectedLocationId,
  canManage,
  title,
  scopeLabel,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onPublish,
  onClearWeek,
  onCopyPreviousWeek,
  onOpenTemplates,
  onAddShift,
  onLocationChange,
  copying,
  templatesLoading,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">
          {title ?? "Grafik pracy"}
        </p>
        <p className="text-2xl font-semibold text-surface-900">
          {range.label}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-surface-300">
          <span className="panel-pill">
            Łącznie zmian: <strong className="text-surface-900">{shiftsCount}</strong>
          </span>
          {scopeLabel && <span className="panel-pill">{scopeLabel}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-3 xl:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-surface-800/70 bg-surface-900/70 px-1">
            <button
              className="btn-secondary rounded-full px-3 py-1.5"
              onClick={onPrevWeek}
              aria-label="Poprzedni tydzień"
            >
              ← Poprzedni
            </button>
            <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onCurrentWeek}>
              Bieżący
            </button>
            <button
              className="btn-secondary rounded-full px-3 py-1.5"
              onClick={onNextWeek}
              aria-label="Następny tydzień"
            >
              Następny →
            </button>
          </div>
          {canManage && (
            <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onPublish}>
              Opublikuj tydzień
            </button>
          )}
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input h-9 w-full min-w-[160px] max-w-[220px] rounded-full bg-surface-900/70 px-3 text-xs sm:w-56"
              value={selectedLocationId}
              onChange={(event) => onLocationChange(event.target.value)}
              aria-label="Filtruj po lokalizacji"
            >
              <option value="">Wszystkie lokalizacje</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <button className="btn-primary rounded-full px-4 py-2 text-sm" onClick={onAddShift}>
              + Dodaj zmianę
            </button>
            <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onOpenTemplates} disabled={templatesLoading}>
              {templatesLoading ? "Ładowanie szablonów..." : "Szablony"}
            </button>
            <button className="btn-secondary rounded-full px-3 py-1.5" onClick={onCopyPreviousWeek} disabled={copying}>
              {copying ? "Kopiowanie..." : "Kopiuj z poprzedniego tygodnia"}
            </button>
            <button
              className="btn-secondary rounded-full px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50:text-rose-300:bg-rose-950/50"
              onClick={onClearWeek}
              disabled={shiftsCount === 0}
            >
              Wyczyść tydzień
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
