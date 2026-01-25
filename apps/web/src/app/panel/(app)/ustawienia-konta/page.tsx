"use client";

import { KadryCard, Section } from "@kadryhr/ui";
import { useAuth } from "../../auth-provider";

export default function AccountSettingsPage() {
  const { memberships } = useAuth();

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Ustawienia konta</h1>
          <p className="mt-2 text-emerald-700">Twoje aktywne członkostwa w organizacjach.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {memberships.map((membership) => (
            <KadryCard key={membership.id} className="p-5">
              <p className="text-sm text-emerald-500">Organizacja</p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {membership.organization.name}
              </p>
              <p className="mt-1 text-sm text-emerald-700">Rola: {membership.role}</p>
            </KadryCard>
          ))}
        </div>
      </div>
    </Section>
  );
}
