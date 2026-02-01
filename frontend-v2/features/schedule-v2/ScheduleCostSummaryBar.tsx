import { ScheduleSummaryResponse } from "@/lib/api";

type ScheduleCostSummaryBarProps = {
  summary: ScheduleSummaryResponse | null;
  isLoading?: boolean;
};

export function ScheduleCostSummaryBar({ summary, isLoading }: ScheduleCostSummaryBarProps) {
  const totals = summary?.totals;
  const currency = totals?.currency ?? "PLN";
  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm text-surface-500 shadow-sm">
        Ładowanie podsumowania kosztów…
      </div>
    );
  }

  if (!totals) {
    return null;
  }

  const missingInfo =
    totals.shiftsWithoutRate > 0 || totals.employeesWithoutRate > 0
      ? `+ ${totals.shiftsWithoutRate} zmian / ${totals.employeesWithoutRate} pracowników bez stawki – koszt częściowy`
      : null;

  return (
    <div className="rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm text-surface-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-surface-400">Godziny</span>
          <span className="font-semibold text-surface-900">{totals.hours.toFixed(1)} h</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-surface-400">Koszt</span>
          <span className="font-semibold text-surface-900">{formatter.format(totals.cost)}</span>
        </div>
        {missingInfo && (
          <div className="text-xs text-amber-600" title={missingInfo}>
            {missingInfo}
          </div>
        )}
      </div>
    </div>
  );
}
