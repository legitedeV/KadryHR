"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

type LocationPayload = {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  timezone?: string;
};

const emptyForm: LocationFormState = {
  name: "",
  code: "",
  address: "",
  city: "",
  timezone: "",
};

export default function LocationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locationId = typeof params.id === "string" ? params.id : params.id?.[0];
  const [form, setForm] = useState<LocationFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const locationQuery = useQuery({
    queryKey: ["location", locationId],
    queryFn: () => api.getLocation(locationId ?? ""),
    enabled: Boolean(locationId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: LocationPayload) => api.updateLocation(locationId ?? "", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["location", locationId] }),
        queryClient.invalidateQueries({ queryKey: ["locations"] }),
      ]);
    },
  });

  useEffect(() => {
    if (locationQuery.data) {
      setForm({
        name: locationQuery.data.name ?? "",
        code: locationQuery.data.code ?? "",
        address: locationQuery.data.address ?? "",
        city: locationQuery.data.city ?? "",
        timezone: locationQuery.data.timezone ?? "",
      });
    }
  }, [locationQuery.data]);

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

    const payload: LocationPayload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
    };

    try {
      await updateMutation.mutateAsync(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać lokalizacji.";
      setError(message);
    }
  };

  if (locationQuery.isLoading) {
    return (
      <Section>
        <KadryCard className="p-5">
          <p className="text-sm text-emerald-700">Ładowanie szczegółów lokalizacji...</p>
        </KadryCard>
      </Section>
    );
  }

  if (locationQuery.isError || !locationQuery.data) {
    return (
      <Section>
        <KadryCard className="p-5">
          <p className="text-sm text-red-600">Nie udało się pobrać lokalizacji.</p>
          <div className="mt-4">
            <KadryButton onClick={() => router.push("/panel/lokalizacje")}>Wróć do listy</KadryButton>
          </div>
        </KadryCard>
      </Section>
    );
  }

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-emerald-950">{locationQuery.data.name}</h1>
            <p className="mt-2 text-emerald-700">Edytuj dane lokalizacji i jej ustawienia.</p>
          </div>
          <Link href="/panel/lokalizacje" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
            Wróć do listy
          </Link>
        </div>

        {error ? (
          <KadryCard className="p-4">
            <p className="text-sm text-red-600">{error}</p>
          </KadryCard>
        ) : null}

        <KadryCard className="p-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            <div className="flex justify-end gap-3">
              <KadryButton type="submit" disabled={updateMutation.isPending}>
                Zapisz zmiany
              </KadryButton>
            </div>
          </form>
        </KadryCard>
      </div>
    </Section>
  );
}
