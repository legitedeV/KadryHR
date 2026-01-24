"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api } from "@/lib/api";

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export default function PanelRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validate = () => {
    if (!form.organizationName.trim()) {
      return "Podaj nazwę organizacji.";
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "Podaj imię i nazwisko.";
    }
    if (!isValidEmail(form.email)) {
      return "Podaj poprawny adres email.";
    }
    if (form.password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków.";
    }
    return null;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await api.register(form);
      router.replace("/panel/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się utworzyć konta.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <Section className="py-16">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">KadryHR</p>
            <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Załóż konto</h1>
            <p className="mt-2 text-emerald-700">
              Utwórz organizację i zacznij planować grafik oraz rejestrować czas pracy.
            </p>
          </div>
          <KadryCard className="p-6">
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <label className="text-sm font-medium text-emerald-900">
                Nazwa organizacji
                <input
                  type="text"
                  value={form.organizationName}
                  onChange={handleChange("organizationName")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-emerald-900">
                  Imię
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-emerald-900">
                  Nazwisko
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                    required
                  />
                </label>
              </div>
              <label className="text-sm font-medium text-emerald-900">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Hasło
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900"
                  minLength={8}
                  required
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <KadryButton type="submit" disabled={loading}>
                {loading ? "Tworzenie konta..." : "Załóż konto"}
              </KadryButton>
              <Link href="/panel/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Masz już konto? Zaloguj się
              </Link>
            </form>
          </KadryCard>
        </div>
      </Section>
    </div>
  );
}
