"use client";

import { useQuery } from "@tanstack/react-query";
import { KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";

export default function TimeOffPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.getEmployees(),
  });

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Urlopy i nieobecności</h1>
          <p className="mt-2 text-emerald-700">Przegląd pracowników, dla których można dodać nieobecność.</p>
          {isError ? (
            <p className="mt-2 text-sm text-red-600">
              {error instanceof Error ? error.message : "Nie udało się pobrać listy pracowników"}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((employee) => (
            <KadryCard key={employee.id} className="p-5">
              <p className="text-sm text-emerald-500">Pracownik</p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {employee.firstName} {employee.lastName}
              </p>
              {employee.email ? <p className="mt-1 text-sm text-emerald-700">{employee.email}</p> : null}
            </KadryCard>
          ))}
          {!isLoading && (data ?? []).length === 0 ? (
            <KadryCard className="p-5">
              <p className="text-sm text-emerald-700">Brak pracowników do wyświetlenia.</p>
            </KadryCard>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
