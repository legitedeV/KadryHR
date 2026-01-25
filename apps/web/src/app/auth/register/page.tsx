"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.register({
        organizationName: organizationName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      }),
    onSuccess: () => {
      router.replace("/panel/dashboard");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Nie udało się utworzyć konta";
      setError(message);
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!organizationName.trim() || organizationName.trim().length < 3) {
      setError("Nazwa organizacji musi mieć co najmniej 3 znaki.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Podaj imię i nazwisko.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Podaj poprawny adres email.");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <Section className="py-16">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">KadryHR</p>
            <h1 className="mt-2 text-3xl font-semibold text-emerald-950">
              Załóż konto i utwórz organizację
            </h1>
            <p className="mt-2 text-emerald-700">
              Zacznij zarządzać zespołem, grafikiem i czasem pracy z jednego miejsca.
            </p>
          </div>
          <KadryCard className="p-6">
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <label className="text-sm font-medium text-emerald-900">
                Nazwa firmy
                <input
                  type="text"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                  minLength={3}
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Imię
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Nazwisko
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Hasło
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                  minLength={8}
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <KadryButton type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Tworzenie konta..." : "Załóż konto"}
              </KadryButton>
              <div className="flex flex-col gap-2 text-sm text-emerald-700">
                <Link href="/auth/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                  Masz już konto? Zaloguj się
                </Link>
              </div>
            </form>
          </KadryCard>
        </div>
      </Section>
    </div>
  );
}
