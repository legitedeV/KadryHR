"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function ContactForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    headcount: "",
    message: "",
    consentMarketing: false,
    consentPrivacy: false,
    website: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const utmSource = useMemo(() => searchParams?.get("utm_source") ?? undefined, [searchParams]);
  const utmCampaign = useMemo(() => searchParams?.get("utm_campaign") ?? undefined, [searchParams]);

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      return "Uzupełnij imię, e-mail i nazwę firmy.";
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return "Podaj poprawny adres e-mail.";
    }
    if (!form.consentPrivacy) {
      return "Zgoda na politykę prywatności jest wymagana.";
    }
    return null;
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setError(validationError);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        headcount: form.headcount ? Number(form.headcount) : undefined,
        message: form.message.trim() || undefined,
        consentMarketing: form.consentMarketing,
        consentPrivacy: form.consentPrivacy,
        utmSource,
        utmCampaign,
        website: form.website,
      };

      await apiClient.request("/public/leads", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      });

      setStatus("success");
      setForm({
        name: "",
        email: "",
        company: "",
        headcount: "",
        message: "",
        consentMarketing: false,
        consentPrivacy: false,
        website: "",
      });
    } catch (err) {
      setStatus("error");
      setError((err as Error).message ?? "Nie udało się wysłać formularza.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} aria-live="polite">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <label className="block text-surface-700 dark:text-surface-200" htmlFor="lead-name">
            Imię i nazwisko
          </label>
          <input
            id="lead-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
            placeholder="np. Anna Kowalska"
            required
          />
        </div>
        <div className="space-y-2 text-sm">
          <label className="block text-surface-700 dark:text-surface-200" htmlFor="lead-email">
            E-mail
          </label>
          <input
            id="lead-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
            placeholder="twoj@firma.pl"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <label className="block text-surface-700 dark:text-surface-200" htmlFor="lead-company">
            Firma / sieć
          </label>
          <input
            id="lead-company"
            value={form.company}
            onChange={(e) => updateField("company", e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
            placeholder="np. Sieć Marketów Nova"
            required
          />
        </div>
        <div className="space-y-2 text-sm">
          <label className="block text-surface-700 dark:text-surface-200" htmlFor="lead-headcount">
            Liczba pracowników
          </label>
          <input
            id="lead-headcount"
            value={form.headcount}
            onChange={(e) => updateField("headcount", e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
            placeholder="np. 120"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="block text-surface-700 dark:text-surface-200" htmlFor="lead-message">
          Wiadomość
        </label>
        <textarea
          id="lead-message"
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
          placeholder="Opisz specyfikę grafiku, liczbę lokalizacji i oczekiwania." 
        />
      </div>

      <div className="hidden">
        <label htmlFor="lead-website">Strona</label>
        <input
          id="lead-website"
          value={form.website}
          onChange={(e) => updateField("website", e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-3 text-sm text-surface-600 dark:text-surface-300">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.consentPrivacy}
            onChange={(e) => updateField("consentPrivacy", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            required
          />
          <span>
            Akceptuję <a href="/rodo" className="font-semibold text-brand-600 hover:text-brand-700">politykę prywatności</a>.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.consentMarketing}
            onChange={(e) => updateField("consentMarketing", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            Chcę otrzymywać informacje o nowych funkcjach i webinarach KadryHR.
          </span>
        </label>
      </div>

      {status === "error" && error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      )}
      {status === "success" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          Dziękujemy! Wrócimy do Ciebie z propozycją terminu demo w ciągu 24h.
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-full bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Wysyłamy..." : "Umów demo"}
      </button>
    </form>
  );
}
