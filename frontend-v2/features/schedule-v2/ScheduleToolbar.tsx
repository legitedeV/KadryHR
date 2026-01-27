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
  keyboardMode: boolean;
  keyboardDisabled: boolean;
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
  onToggleKeyboard: () => void;
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
  keyboardMode,
  keyboardDisabled,
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
  onToggleKeyboard,
  onOpenOptions,
}: ScheduleToolbarProps) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <span className="rounded-md border border-surface-200 bg-white px-2 py-1">📌</span>
          <span className="rounded-md border border-surface-200 bg-white px-2 py-1">🗂️</span>
          <span className="rounded-md border border-surface-200 bg-white px-2 py-1">🧩</span>
        </div>
        <div className="flex items-center gap-3">
          {timeBuffer && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-600">
              Wpisano: {timeBuffer}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleKeyboard}
            disabled={keyboardDisabled}
            title={keyboardDisabled ? "Wybierz jedną lokalizację, aby włączyć tryb klawiatury." : ""}
            className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition ${
              keyboardMode ? "border-brand-500 bg-white text-brand-700" : "border-surface-200 bg-white text-surface-500"
            } ${keyboardDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-base">{keyboardMode ? "●" : "◯"}</span>
            <span className="text-base">🖱️</span>
            Tryb klawiatury
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-600 hover:bg-surface-100"
            aria-label="Poprzedni tydzień"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onOpenRangeModal}
            className="rounded-md border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-800 hover:bg-surface-100"
          >
            {rangeLabel}
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-600 hover:bg-surface-100"
            aria-label="Następny tydzień"
          >
            →
          </button>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-700"
            value={viewMode}
            onChange={(event) => onViewModeChange(event.target.value)}
          >
            <option value="week">Widok zmian</option>
            <option value="day">Widok dzienny</option>
            <option value="month">Widok miesięczny</option>
          </select>

          <select
            className="h-10 rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-700"
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
            className="h-10 rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-700"
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
            className="h-10 rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-700"
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
            className="h-10 rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-700"
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
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
          >
            Sortuj
          </button>
          <div className="relative">
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Szukaj..."
              className="h-10 w-44 rounded-md border border-surface-200 bg-white px-3 text-sm text-surface-700"
            />
          </div>
          <button
            type="button"
            className="rounded-md border border-surface-200 bg-white p-2 text-surface-600 hover:bg-surface-100"
            aria-label="Akcja: notatki"
          >
            🗒️
          </button>
          <button
            type="button"
            className="rounded-md border border-surface-200 bg-white p-2 text-surface-600 hover:bg-surface-100"
            aria-label="Akcja: eksport"
          >
            ⬇️
          </button>
          <button
            type="button"
            className="rounded-md border border-surface-200 bg-white p-2 text-surface-600 hover:bg-surface-100"
            aria-label="Akcja: powiadomienia"
          >
            🔔
          </button>
          <button
            type="button"
            onClick={onOpenOptions}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
          >
            Opcje
          </button>
        </div>
      </div>
    </div>
  );
}
