"use client";

import { KadryCard, Section } from "@kadryhr/ui";
import { useAuth } from "../../auth-provider";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Profil</h1>
          <p className="mt-2 text-emerald-700">Podstawowe informacje o Twoim koncie.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Imię i nazwisko</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {user.firstName} {user.lastName}
            </p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Adres email</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">{user.email}</p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-500">Rola</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">{user.role}</p>
          </KadryCard>
        </div>
      </div>
    </Section>
  );
}
