"use client";

type KpiTileProps = {
  label: string;
  value: string;
  helper?: string;
  trend?: string;
  className?: string;
};

export function KpiTile({ label, value, helper, trend, className }: KpiTileProps) {
  return (
    <div
      className={`border border-[var(--border-soft)] bg-[var(--bg-card)] rounded-md px-4 py-3 shadow-[0_1px_2px_rgba(31,41,55,0.06)] ${
        className ?? ""
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold text-[var(--text-main)]">{value}</span>
        {trend && <span className="text-xs text-[var(--accent-hover)] font-semibold">{trend}</span>}
      </div>
      {helper && <p className="mt-2 text-xs text-[var(--text-muted)]">{helper}</p>}
    </div>
  );
}
