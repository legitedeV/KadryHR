"use client";

import { KadryCard, Section } from "@kadryhr/ui";
import { useAuth } from "../../auth-provider";

export default function OrganizationSettingsPage() {
  const { currentOrganization } = useAuth();

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Ustawienia organizacji</h1>
          <p className="mt-2 text-emerald-700">Podstawowe informacje o Twojej organizacji.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Nazwa</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {currentOrganization?.name ?? "Brak danych"}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Slug</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {currentOrganization?.slug ?? "Brak danych"}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Email kontaktowy</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {currentOrganization?.email ?? "Brak danych"}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Telefon</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {currentOrganization?.phone ?? "Brak danych"}
            </p>
          </KadryCard>
        </div>
      </div>
    </Section>
  );
}
