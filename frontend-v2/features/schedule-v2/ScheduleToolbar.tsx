"use client";

import { LocationRecord } from "@/lib/api";
import { formatDateKey, formatWeekLabel } from "./schedule-utils";

type ScheduleToolbarProps = {
  weekStart: Date;
  weekEnd: Date;
  locationId: string;
  locations: LocationRecord[];
  onLocationChange: (value: string) => void;
  onWeekChange: (value: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onAddShift: () => void;
  onCopyWeek: () => void;
  onApplyTemplate: () => void;
  onSaveTemplate: () => void;
  onPublish: () => void;
  onStartTour: () => void;
  publishedLabel: string;
  canManage: boolean;
};

export function ScheduleToolbar({
  weekStart,
  weekEnd,
  locationId,
  locations,
  onLocationChange,
  onWeekChange,
  onPrevWeek,
  onNextWeek,
  onAddShift,
  onCopyWeek,
  onApplyTemplate,
  onSaveTemplate,
  onPublish,
  onStartTour,
  publishedLabel,
  canManage,
}: ScheduleToolbarProps) {
  return (
    <div className="panel-card p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Tydzień</p>
          <p className="text-lg font-semibold text-surface-50">{formatWeekLabel(weekStart, weekEnd)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="panel-button"
          >
            ← Poprzedni
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="panel-button"
          >
            Następny →
          </button>
          <input
            type="date"
            value={formatDateKey(weekStart)}
            onChange={(event) => onWeekChange(event.target.value)}
            className="panel-input h-10 w-[170px]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="panel-input h-10 min-w-[180px]"
          value={locationId}
          onChange={(event) => onLocationChange(event.target.value)}
        >
          <option value="">Wszystkie lokalizacje</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <span className="panel-pill">{publishedLabel}</span>
        <button
          type="button"
          onClick={onAddShift}
          className="panel-button-primary disabled:opacity-60 disabled:cursor-not-allowed"
          data-onboarding-target="schedule-add-shift"
          disabled={!canManage}
        >
          + Dodaj zmianę
        </button>
        <button
          type="button"
          onClick={onCopyWeek}
          className="panel-button disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!canManage}
        >
          Kopiuj tydzień
        </button>
        <button
          type="button"
          onClick={onSaveTemplate}
          className="panel-button disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!canManage}
        >
          Zapisz jako szablon
        </button>
        <button
          type="button"
          onClick={onApplyTemplate}
          className="panel-button disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!canManage}
        >
          Zastosuj szablon
        </button>
        <button
          type="button"
          onClick={onPublish}
          className="panel-button-primary disabled:opacity-60 disabled:cursor-not-allowed"
          data-onboarding-target="schedule-publish"
          disabled={!canManage}
        >
          Opublikuj grafik
        </button>
        <button type="button" onClick={onStartTour} className="panel-button">
          Uruchom przewodnik po grafiku
        </button>
      </div>
    </div>
  );
}
