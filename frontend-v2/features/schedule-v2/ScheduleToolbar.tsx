"use client";

import { LocationRecord } from "@/lib/api";

type ScheduleToolbarProps = {
  rangeLabel: string;
  viewMode: string;
  locationId: string;
  locations: LocationRecord[];
  positionFilter: string;
  positionOptions: string[];
  employmentFilter: string;
  employmentOptions: string[];
  sortMode: string;
  searchValue: string;
  timeBuffer: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onOpenRangeModal: () => void;
  onViewModeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPositionFilterChange: (value: string) => void;
  onEmploymentFilterChange: (value: string) => void;
  onSortModeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortAction: () => void;
  onOpenOptions: () => void;
};

export function ScheduleToolbar({
  rangeLabel,
  viewMode,
  locationId,
  locations,
  positionFilter,
  positionOptions,
  employmentFilter,
  employmentOptions,
  sortMode,
  searchValue,
  timeBuffer,
  onPrevWeek,
  onNextWeek,
  onOpenRangeModal,
  onViewModeChange,
  onLocationChange,
  onPositionFilterChange,
  onEmploymentFilterChange,
  onSortModeChange,
  onSearchChange,
  onSortAction,
  onOpenOptions,
}: ScheduleToolbarProps) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {timeBuffer && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-600">
              Wpisano: {timeBuffer}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
            aria-label="Poprzedni tydzień"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onOpenRangeModal}
            className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm font-semibold text-surface-800 hover:bg-surface-100 transition-colors"
          >
            {rangeLabel}
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
            aria-label="Następny tydzień"
          >
            →
          </button>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-surface-200 bg-white px-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            value={viewMode}
            onChange={(event) => onViewModeChange(event.target.value)}
          >
            <option value="week">Widok zmian</option>
            <option value="day">Widok dzienny</option>
            <option value="month">Widok miesięczny</option>
          </select>

          <select
            className="h-9 rounded-md border border-surface-200 bg-white px-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            value={locationId}
            onChange={(event) => onLocationChange(event.target.value)}
          >
            <option value="">({locations.length || 0}) Lokalizacje</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-surface-200 bg-white px-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            value={positionFilter}
            onChange={(event) => onPositionFilterChange(event.target.value)}
          >
            <option value="">({positionOptions.length || 0}) Stanowiska</option>
            {positionOptions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-surface-200 bg-white px-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            value={employmentFilter}
            onChange={(event) => onEmploymentFilterChange(event.target.value)}
          >
            <option value="">({employmentOptions.length || 0}) Typy umów</option>
            {employmentOptions.map((employment) => (
              <option key={employment} value={employment}>
                {employment}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-surface-200 bg-white px-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value)}
          >
            <option value="custom">Własny</option>
            <option value="firstName">Imię A–Z</option>
            <option value="lastName">Nazwisko A–Z</option>
          </select>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSortAction}
            className="rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
          >
            Sortuj
          </button>
          <div className="relative">
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Szukaj..."
              className="h-9 w-40 rounded-md border border-surface-200 bg-white px-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={onOpenOptions}
            className="rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
          >
            Opcje
          </button>
        </div>
      </div>
    </div>
  );
}
