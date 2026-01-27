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

// Check if color is a valid hex color format
function isHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
}

// Get color with alpha for border and background
function getColorWithAlpha(color: string | null | undefined, alphaHex: string): string | undefined {
  if (!color || !isHexColor(color)) return undefined;
  return color + alphaHex;
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
      <p className="text-xs font-medium text-surface-600">Typ zmiany:</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const hasValidColor = preset.color && isHexColor(preset.color);
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-400 ${
                isSelected
                  ? "ring-2 ring-brand-400"
                  : ""
              }`}
              style={{
                borderColor: getColorWithAlpha(preset.color, "50"),
                backgroundColor: getColorWithAlpha(preset.color, "15"),
                color: hasValidColor && preset.color ? preset.color : undefined,
              }}
              onClick={() => onSelect(isSelected ? null : preset)}
            >
              {hasValidColor && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: preset.color ?? undefined }}
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
          className={`inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold text-surface-600 transition hover:border-brand-400 disabled:opacity-50 disabled:cursor-not-allowed ${
            !selectedPresetId ? "ring-2 ring-brand-400" : ""
          }`}
          onClick={() => onSelect(null)}
        >
          Niestandardowa
        </button>
      </div>
    </div>
  );
}
