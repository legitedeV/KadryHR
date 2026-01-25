"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.login(email.trim(), password),
    onSuccess: () => {
      router.replace("/panel/dashboard");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Nie udało się zalogować";
      setError(message);
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Uzupełnij email oraz hasło.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Podaj poprawny adres email.");
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
            <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Zaloguj się do KadryHR</h1>
            <p className="mt-2 text-emerald-700">
              Panel pracy dla zespołów HR. Wprowadź dane, aby przejść do pulpitu.
            </p>
          </div>
          <KadryCard className="p-6">
            <form className="flex flex-col gap-4" onSubmit={submit}>
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
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <KadryButton type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Logowanie..." : "Zaloguj się"}
              </KadryButton>
              <div className="flex flex-col gap-2 text-sm text-emerald-700">
                <Link href="/auth/register" className="font-medium text-emerald-600 hover:text-emerald-700">
                  Nie masz jeszcze konta? Załóż konto
                </Link>
                <Link href="/panel/forgot-password" className="text-emerald-600 hover:text-emerald-700">
                  Zapomniałem hasła
                </Link>
              </div>
            </form>
          </KadryCard>
        </div>
      </Section>
    </div>
  );
}
