"use client";

import { FormEvent, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { pushToast } from "@/lib/toast";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !consent) {
      pushToast({
        title: "Brakuje danych",
        description: "Podaj e-mail i potwierdź zgodę marketingową.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.request("/public/newsletter/subscribe", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, name: name || undefined, marketingConsent: consent }),
      });
      setSuccess(true);
    } catch {
      pushToast({
        title: "Nie udało się zapisać",
        description: "Spróbuj ponownie za chwilę.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-soft ring-1 ring-slate-100/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:ring-slate-800">
      <div className="flex flex-col gap-2 pb-4">
        <p className="text-xs uppercase text-brand-600 dark:text-brand-200">Newsletter</p>
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Zapisz się na nowości KadryHR
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Co tydzień wysyłamy krótkie podsumowanie zmian: grafiki, wnioski urlopowe, powiadomienia i wskazówki RODO.
        </p>
      </div>
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          Sprawdź skrzynkę – wysłaliśmy link potwierdzający. Wiadomość mogła trafić do folderu &quot;Oferty&quot; lub &quot;Spam&quot;.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-900/50"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
              Imię (opcjonalnie)
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-900/50"
              />
            </label>
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Wyrażam zgodę na otrzymywanie informacji handlowych i newslettera KadryHR na podany adres e-mail. Zgoda jest dobrowolna i można ją odwołać w każdym czasie.
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? "Wysyłamy..." : "Zapisz się"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero spamu. Tylko realne aktualizacje produktu KadryHR.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
