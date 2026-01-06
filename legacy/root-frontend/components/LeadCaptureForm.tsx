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
    <form className="space-y-4" onSubmit={handleSubmit} data-analytics-id="hero-lead-form">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-200" htmlFor="lead-email">
          E-mail do kontaktu
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="lead-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={status === "error" && Boolean(message)}
            aria-describedby="lead-feedback"
            className="input-field flex-1"
            placeholder="np. kontakt@twojsklep.pl"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap"
            disabled={status === "loading"}
            data-analytics-id="hero-lead-submit"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Wysyłanie...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Umów prezentację
              </>
            )}
          </button>
        </div>
      </div>
      <div
        id="lead-feedback"
        role="status"
        aria-live="polite"
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
          status === "error"
            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50"
            : status === "success"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/50"
              : "bg-surface-50 text-surface-600 ring-1 ring-surface-200/80 dark:bg-surface-900/50 dark:text-surface-300 dark:ring-surface-700/50"
        }`}
      >
        {status === "error" && (
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        {status === "success" && (
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        {status === "idle" && (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>{message ?? "Zostaw mail, oddzwonimy z prezentacją (14 dni testów gratis)."}</span>
      </div>
    </form>
  );
}
