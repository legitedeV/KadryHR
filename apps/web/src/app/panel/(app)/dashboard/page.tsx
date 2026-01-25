"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, KadryCard, Section } from "@kadryhr/ui";
import { api, Employee, Location, Shift, TimeEntry } from "@/lib/api";
import { useAuth } from "../auth-provider";

export default function DashboardPage() {
  const { currentOrganization } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [locationsData, employeesData] = await Promise.all([
          api.getLocations(),
          api.getEmployees(),
        ]);
        setLocations(locationsData);
        setEmployees(employeesData);

        const now = new Date();
        const from = new Date(now);
        const to = new Date(now);
        to.setDate(now.getDate() + 7);
        const [shiftsData, entriesData] = await Promise.all([
          api.getShifts({ from: from.toISOString(), to: to.toISOString() }),
          api.getTimeEntries({ from: from.toISOString(), to: to.toISOString() }),
        ]);
        setShifts(shiftsData);
        setEntries(entriesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nie udało się pobrać danych";
        setError(message);
      }
    };

    void load();
  }, []);

  const openEntriesCount = useMemo(
    () => entries.filter((entry) => !entry.clockOut).length,
    [entries]
  );

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <Badge>Organizacja</Badge>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">
            {currentOrganization?.name ?? "..."}
          </h1>
          <p className="mt-2 text-emerald-700">Szybki podgląd stanu Twojej organizacji.</p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Lokalizacje</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{locations.length}</p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Pracownicy</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{employees.length}</p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Zmiany (7 dni)</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{shifts.length}</p>
          </KadryCard>
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Otwarte wejścia</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{openEntriesCount}</p>
          </KadryCard>
        </div>
      </div>
    </Section>
  );
}
