"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["timesheet-summary", from.toISOString(), now.toISOString()],
    queryFn: () =>
      api.getTimesheet({
        from: from.toISOString(),
        to: now.toISOString(),
      }),
  });

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Raporty</h1>
          <p className="mt-2 text-emerald-700">Podsumowanie czasu pracy z ostatnich 7 dni.</p>
          {isError ? (
            <p className="mt-2 text-sm text-red-600">
              {error instanceof Error ? error.message : "Nie udało się pobrać raportu"}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Łączna liczba godzin</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {isLoading ? "…" : data?.totalHours ?? 0}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Zarejestrowane wpisy</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {isLoading ? "…" : data?.totalEntries ?? 0}
            </p>
          </KadryCard>
        </div>
      </div>
    </Section>
  );
}
