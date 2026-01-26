"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";

type LocationFormState = {
  name: string;
  code: string;
  address: string;
  city: string;
  timezone: string;
};

const emptyForm: LocationFormState = {
  name: "",
  code: "",
  address: "",
  city: "",
  timezone: "",
};

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<LocationFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: api.getLocations,
  });

  const createMutation = useMutation({
    mutationFn: api.createLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setForm(emptyForm);
    setError(null);
  };

  const handleChange = (field: keyof LocationFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) {
      setError("Nazwa lokalizacji musi mieć co najmniej 2 znaki.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać lokalizacji.";
      setError(message);
    }
  };

  const handleDelete = async (locationId: string) => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(locationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć lokalizacji.";
      setError(message);
    }
  };

  const locations = useMemo(() => locationsQuery.data ?? [], [locationsQuery.data]);

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-emerald-950">Lokalizacje</h1>
            <p className="mt-2 text-emerald-700">Dodawaj lokalizacje i adresy dla zespołów.</p>
          </div>
          <KadryButton onClick={openCreate}>Dodaj lokalizację</KadryButton>
        </div>

        {locationsQuery.isLoading ? (
          <KadryCard className="p-5">
            <p className="text-sm text-emerald-700">Ładowanie lokalizacji...</p>
          </KadryCard>
        ) : null}

        {locationsQuery.isError ? (
          <KadryCard className="p-5">
            <p className="text-sm text-red-600">Nie udało się pobrać lokalizacji.</p>
          </KadryCard>
        ) : null}

        {error ? (
          <KadryCard className="p-4">
            <p className="text-sm text-red-600">{error}</p>
          </KadryCard>
        ) : null}

        <KadryCard className="overflow-x-auto p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-emerald-700">
                <th className="py-2 pr-4">Nazwa</th>
                <th className="py-2 pr-4">Kod</th>
                <th className="py-2 pr-4">Miasto</th>
                <th className="py-2 pr-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-t border-emerald-100">
                  <td className="py-3 pr-4 text-emerald-950">{location.name}</td>
                  <td className="py-3 pr-4 text-emerald-800">{location.code ?? "-"}</td>
                  <td className="py-3 pr-4 text-emerald-800">{location.city ?? "-"}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        href={`/panel/lokalizacje/${location.id}`}
                      >
                        Edytuj
                      </Link>
                      <button
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(location.id)}
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && !locationsQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-emerald-700">
                    Brak lokalizacji – dodaj pierwszą.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </KadryCard>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-950">Dodaj lokalizację</h2>
              <button className="text-sm text-emerald-600" onClick={closeModal}>
                Zamknij
              </button>
            </div>
            <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-emerald-900">
                Nazwa
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Kod
                <input
                  type="text"
                  value={form.code}
                  onChange={handleChange("code")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Adres
                <input
                  type="text"
                  value={form.address}
                  onChange={handleChange("address")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Miasto
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange("city")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Strefa czasowa
                <input
                  type="text"
                  value={form.timezone}
                  onChange={handleChange("timezone")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex justify-end gap-3">
                <KadryButton type="button" variant="ghost" onClick={closeModal}>
                  Anuluj
                </KadryButton>
                <KadryButton type="submit" disabled={createMutation.isPending}>
                  Dodaj
                </KadryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
