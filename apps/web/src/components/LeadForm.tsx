"use client";

import { useState, type FormEvent } from "react";
import { KadryButton } from "@kadryhr/ui";

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  employeesCount: "",
  message: "",
};

export function LeadForm({ source }: { source: string }) {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "https://kadryhr.pl/api"}/leads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            company: form.company,
            employeesCount: form.employeesCount,
            message: form.message,
            source,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Nie udało się wysłać formularza.");
      }

      setStatus("success");
      setForm(initialState);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Wystąpił błąd.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
          Imię
          <input
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
            className="rounded-2xl border border-emerald-100 px-4 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
          Nazwisko
          <input
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            required
            className="rounded-2xl border border-emerald-100 px-4 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
          Email służbowy
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
            required
            className="rounded-2xl border border-emerald-100 px-4 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
          Firma
          <input
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
            required
            className="rounded-2xl border border-emerald-100 px-4 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
          Liczba pracowników
          <input
            value={form.employeesCount}
            onChange={(event) => setForm({ ...form, employeesCount: event.target.value })}
            required
            className="rounded-2xl border border-emerald-100 px-4 py-2 text-sm"
          />
        </label>
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-emerald-900">
        Wiadomość
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          rows={4}
          className="rounded-2xl border border-emerald-100 px-4 py-2 text-sm"
        />
      </label>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <KadryButton type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Wysyłanie..." : "Wyślij zapytanie"}
        </KadryButton>
        {status === "success" ? (
          <p className="text-sm font-medium text-emerald-600">
            Dziękujemy! Skontaktujemy się w ciągu 24 godzin.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm font-medium text-red-600">{errorMessage}</p>
        ) : null}
      </div>
    </form>
  );
}
