"use client";

import { FormEvent, useMemo, useState } from "react";

const emailPattern = /\S+@\S+\.\S+/;

type Status = "idle" | "loading" | "success" | "error";

export function LeadCaptureForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isInvalidEmail = useMemo(() => {
    if (!email) return false;
    return !emailPattern.test(email);
  }, [email]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Podaj adres e-mail, abyśmy mogli się odezwać.");
      setStatus("error");
      return;
    }
    if (isInvalidEmail) {
      setMessage("Wpisz poprawny adres e-mail (np. kontakt@twojsklep.pl).");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setMessage(null);
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setMessage("Dziękujemy! Sprawdzimy i wrócimy z ofertą.");
      setEmail("");
    } catch (error) {
      console.error("Lead capture error", error);
      setStatus("error");
      setMessage("Coś poszło nie tak. Spróbuj ponownie za chwilę.");
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit} data-analytics-id="hero-lead-form">
      <div className="space-y-1 text-sm">
        <label className="block text-slate-700 dark:text-slate-200" htmlFor="lead-email">
          E-mail do kontaktu
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="lead-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={status === "error" && Boolean(message)}
            aria-describedby="lead-feedback"
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
            placeholder="np. kontakt@twojsklep.pl"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "loading"}
            data-analytics-id="hero-lead-submit"
          >
            {status === "loading" ? "Wysyłanie..." : "Umów prezentację"}
          </button>
        </div>
      </div>
      <p
        id="lead-feedback"
        role="status"
        aria-live="polite"
        className={`text-xs ${
          status === "error"
            ? "text-rose-700 bg-rose-50 border border-rose-200"
            : status === "success"
              ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
              : "text-slate-500"
        } rounded-xl px-3 py-2 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-700`}
      >
        {message ?? "Zostaw mail, oddzwonimy z prezentacją (14 dni testów gratis)."}
      </p>
    </form>
  );
}
