"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function NewsletterConfirmPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setStatus("error");
        setError("Brak tokenu potwierdzającego.");
        return;
      }
      try {
        await apiClient.request("/public/newsletter/confirm", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ token }),
        });
        setStatus("success");
      } catch (err) {
        setError("Link wygasł lub jest nieprawidłowy. Zapisz się ponownie.");
        setStatus("error");
      }
    }
    confirm();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-16 text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-soft ring-1 ring-slate-100/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:ring-slate-800">
        <h1 className="text-3xl font-semibold">Potwierdzenie subskrypcji</h1>
        {status === "loading" && (
          <p className="mt-4 text-slate-600 dark:text-slate-300">Potwierdzamy Twój adres e-mail...</p>
        )}
        {status === "success" && (
          <div className="mt-4 space-y-3 text-slate-700 dark:text-slate-200">
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              Subskrypcja potwierdzona!
            </p>
            <p>Sprawdź skrzynkę – wysłaliśmy pierwszego maila z nowościami.</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/panel/dashboard"
                className="rounded-full bg-brand-500 px-4 py-2 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-600"
              >
                Przejdź do panelu
              </Link>
              <Link
                href="/"
                className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-100"
              >
                Wróć na stronę główną
              </Link>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="mt-4 space-y-3 text-slate-700 dark:text-slate-200">
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-200">Nie udało się potwierdzić.</p>
            <p>{error}</p>
            <Link
              href="/#newsletter"
              className="inline-flex w-fit rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Zapisz się ponownie
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
