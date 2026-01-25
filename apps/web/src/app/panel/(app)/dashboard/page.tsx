"use client";

import { Badge, KadryCard, Section } from "@kadryhr/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "../../auth-provider";

export default function DashboardPage() {
  const { currentOrganization } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["organization-summary"],
    queryFn: () => api.getOrganizationSummary(),
  });

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <Badge>Organizacja</Badge>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">
            {currentOrganization?.name ?? "..."}
          </h1>
          <p className="mt-2 text-emerald-700">Szybki podgląd stanu Twojej organizacji.</p>
          {isError ? (
            <p className="mt-2 text-sm text-red-600">
              {error instanceof Error ? error.message : "Nie udało się pobrać danych"}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Lokalizacje</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {isLoading ? "…" : data?.locationsCount ?? 0}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Pracownicy</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {isLoading ? "…" : data?.employeesCount ?? 0}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Zmiany (7 dni)</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {isLoading ? "…" : data?.shiftsLast7DaysCount ?? 0}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Otwarte zgłoszenia RCP</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {isLoading ? "…" : data?.openTimeAnomaliesCount ?? 0}
            </p>
          </KadryCard>
        </div>
      </div>
    </Section>
  );
}
