"use client";

import { useEffect, useMemo, useState } from "react";

type LeadFormState = {
  name: string;
  email: string;
  company: string;
  headcount: string;
  message: string;
  consentMarketing: boolean;
  consentPrivacy: boolean;
};

type LeadStatus = "idle" | "loading" | "success" | "error";

type LeadResponse = {
  success?: boolean;
  message?: string;
};

const initialState: LeadFormState = {
  name: "",
  email: "",
  company: "",
  headcount: "",
  message: "",
  consentMarketing: false,
  consentPrivacy: false,
};

export function LeadFormSection() {
  const [formState, setFormState] = useState<LeadFormState>(initialState);
  const [status, setStatus] = useState<LeadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [utmSource, setUtmSource] = useState<string | undefined>(undefined);
  const [utmCampaign, setUtmCampaign] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") ?? undefined;
    const campaign = params.get("utm_campaign") ?? undefined;
    setUtmSource(source);
    setUtmCampaign(campaign);
  }, []);

  const isSubmitting = status === "loading";

  const canSubmit = useMemo(() => {
    return (
      formState.name.trim().length > 0 &&
      formState.email.trim().length > 0 &&
      formState.company.trim().length > 0 &&
      formState.consentPrivacy
    );
  }, [formState]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : value;
    setFormState((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) {
      return;
    }
    setStatus("loading");
    setErrorMessage(null);

    const payload = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      company: formState.company.trim(),
      headcount: formState.headcount
        ? Number(formState.headcount)
        : undefined,
      message: formState.message.trim() || undefined,
      consentMarketing: formState.consentMarketing,
      consentPrivacy: formState.consentPrivacy,
      utmSource,
      utmCampaign,
      website:
        typeof window !== "undefined" ? window.location.hostname : undefined,
    };

    try {
      const response = await fetch("/api/public/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as LeadResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Nie udało się wysłać formularza.");
      }

      setStatus("success");
      setFormState(initialState);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Wystąpił nieoczekiwany błąd.",
      );
    }
  };

  return (
    <section id="lead-form" className="relative bg-[#F7F9FB] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F7F9FB] to-[#FFFFFF]" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              Umów prezentację
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-surface-900 sm:text-4xl">
              Zostaw kontakt — pokażemy Ci KadryHR na Twoich danych.
            </h2>
            <p className="mt-4 text-surface-600">
              Odezwiemy się w ciągu 24h, przygotujemy demo dopasowane do Twojej
              organizacji i policzymy realne oszczędności.
            </p>
            <div className="mt-6 rounded-3xl border border-surface-300 bg-surface-100 p-6 text-sm text-surface-600">
              <p className="text-surface-700">Dlaczego warto?</p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-300" />
                  Demo prowadzi opiekun wdrożeń, nie handlowiec.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-300" />
                  Od razu wiesz, jak KadryHR działa w Twoim modelu zmianowym.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-300" />
                  Otrzymujesz gotowy plan wdrożenia i kosztorys.
                </li>
              </ul>
            </div>
          </div>
          <form
            className="rounded-[2.5rem] border border-emerald-300/30 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-transparent p-8"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4">
              <div>
                <label className="text-sm text-surface-600" htmlFor="name">
                  Imię i nazwisko
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-surface-300 bg-white px-4 py-3 text-sm text-surface-900 outline-none transition focus:border-emerald-300/60"
                />
              </div>
              <div>
                <label className="text-sm text-surface-600" htmlFor="email">
                  Email służbowy
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-surface-300 bg-white px-4 py-3 text-sm text-surface-900 outline-none transition focus:border-emerald-300/60"
                />
              </div>
              <div>
                <label className="text-sm text-surface-600" htmlFor="company">
                  Firma / sieć
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={formState.company}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-surface-300 bg-white px-4 py-3 text-sm text-surface-900 outline-none transition focus:border-emerald-300/60"
                />
              </div>
              <div>
                <label className="text-sm text-surface-600" htmlFor="headcount">
                  Liczba pracowników
                </label>
                <input
                  id="headcount"
                  name="headcount"
                  type="number"
                  min={1}
                  value={formState.headcount}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-surface-300 bg-white px-4 py-3 text-sm text-surface-900 outline-none transition focus:border-emerald-300/60"
                />
              </div>
              <div>
                <label className="text-sm text-surface-600" htmlFor="message">
                  Opisz krótko wyzwania
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formState.message}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-surface-300 bg-white px-4 py-3 text-sm text-surface-900 outline-none transition focus:border-emerald-300/60"
                />
              </div>
            </div>
            <div className="mt-6 space-y-3 text-xs text-surface-600">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="consentPrivacy"
                  checked={formState.consentPrivacy}
                  onChange={handleChange}
                  required
                  className="mt-1 h-4 w-4 rounded border-surface-400 bg-white text-emerald-300"
                />
                <span>
                  Akceptuję politykę prywatności i wyrażam zgodę na kontakt w sprawie
                  prezentacji KadryHR.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="consentMarketing"
                  checked={formState.consentMarketing}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-surface-400 bg-white text-emerald-300"
                />
                <span>Chcę otrzymywać informacje o nowościach i produktach.</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="mt-6 w-full rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-surface-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-200/60"
            >
              {isSubmitting ? "Wysyłamy..." : "Wyślij zgłoszenie"}
            </button>
            <div
              className="mt-4 text-xs"
              role="status"
              aria-live="polite"
            >
              {status === "success" && (
                <p className="text-emerald-200">
                  Dziękujemy! Wkrótce wrócimy z propozycją terminu demo.
                </p>
              )}
              {status === "error" && (
                <p className="text-rose-200">
                  {errorMessage ?? "Nie udało się wysłać formularza."}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
