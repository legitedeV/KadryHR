"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";
import { useAuth } from "../../auth-provider";

export default function SelectOrganizationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { memberships, currentOrganization } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (organizationId: string) => api.switchOrganization(organizationId),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/panel/dashboard");
      router.refresh();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Nie udało się zmienić organizacji";
      setError(message);
    },
  });

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Wybierz organizację</h1>
          <p className="mt-2 text-emerald-700">
            Wybierz organizację, w której chcesz pracować w tym momencie.
          </p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {memberships.map((membership) => {
            const organization = membership.organization;
            const isCurrent = organization.id === currentOrganization?.id;
            return (
              <KadryCard key={membership.id} className="flex flex-col gap-4 p-5">
                <div>
                  <p className="text-sm text-emerald-500">Organizacja</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-950">{organization.name}</p>
                  <p className="mt-1 text-sm text-emerald-700">Rola: {membership.role}</p>
                </div>
                <KadryButton
                  onClick={() => mutation.mutate(organization.id)}
                  disabled={isCurrent || mutation.isPending}
                >
                  {isCurrent ? "Aktywna organizacja" : "Przełącz"}
                </KadryButton>
              </KadryCard>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
