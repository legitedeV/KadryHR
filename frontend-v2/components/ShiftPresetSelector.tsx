"use client";

import { ShiftPresetRecord } from "@/lib/api";

interface ShiftPresetSelectorProps {
  presets: ShiftPresetRecord[];
  selectedPresetId?: string | null;
  onSelect: (preset: ShiftPresetRecord | null) => void;
  disabled?: boolean;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function ShiftPresetSelector({
  presets,
  selectedPresetId,
  onSelect,
  disabled = false,
}: ShiftPresetSelectorProps) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-surface-600 dark:text-surface-400">Typ zmiany:</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-400 dark:hover:border-brand-700 ${
                isSelected
                  ? "ring-2 ring-brand-400 dark:ring-brand-600"
                  : ""
              }`}
              style={{
                borderColor: preset.color ? preset.color + "50" : undefined,
                backgroundColor: preset.color ? preset.color + "15" : undefined,
                color: preset.color ?? undefined,
              }}
              onClick={() => onSelect(isSelected ? null : preset)}
            >
              {preset.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
              )}
              <span>{preset.name}</span>
              <span className="text-[10px] opacity-70">
                ({formatMinutes(preset.startMinutes)}–{formatMinutes(preset.endMinutes)})
              </span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1 text-xs font-semibold text-surface-600 dark:text-surface-300 transition hover:border-brand-400 dark:hover:border-brand-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            !selectedPresetId ? "ring-2 ring-brand-400 dark:ring-brand-600" : ""
          }`}
          onClick={() => onSelect(null)}
        >
          Niestandardowa
        </button>
      </div>
    </div>
  );
}
