"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import { apiRequestPasswordReset } from "@/lib/api";
import { BrandLogoMotion } from "@/components/brand/BrandLogoMotion";

function parseError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.kind === "timeout" || err.kind === "network") {
      return "Brak połączenia";
    }
    if (err.status && err.status >= 500) {
      return "Błąd serwera";
    }
    return err.message || "Nie udało się wysłać linku resetu";
  }
  return err instanceof Error ? err.message : "Nie udało się wysłać linku resetu";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequestPasswordReset(email);
      setSent(true);
    } catch (err: unknown) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 panel-shell relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="hero-aurora" />
        <div className="floating-orb orb-slow -left-28 top-12 h-52 w-52 bg-brand-700/40" />
        <div className="floating-orb orb-fast -right-24 bottom-16 h-44 w-44 bg-accent-700/30" />
      </div>

      <div className="w-full max-w-md panel-card p-8 shadow-elevated">
        <div className="flex items-center justify-center mb-8">
          <BrandLogoMotion size={56} variant="full" withPL ariaLabel="KadryHR – Kadry i płace bez tajemnic" />
        </div>

        <h1 className="text-2xl font-semibold text-surface-100 text-center mb-2">
          Reset hasła
        </h1>
        <p className="text-sm text-surface-400 text-center mb-6">
          Podaj adres e-mail, a wyślemy link do ustawienia nowego hasła.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-800/50">
              Sprawdź skrzynkę e-mail. Jeśli konto istnieje, link do resetu został wysłany.
            </div>
            <Link href="/login" className="btn-primary w-full justify-center py-3">
              Wróć do logowania
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-200">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
                  <svg className="h-5 w-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  className="input-field input-field-with-icon h-12 pr-4 text-left"
                  placeholder="twoj@email.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-950/50 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-800/50">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !email} className="btn-primary w-full justify-center py-3">
              {loading ? "Wysyłanie..." : "Wyślij link resetu"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-surface-800 text-center text-sm text-surface-400">
          <p>
            Wróć do{" "}
            <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
              logowania
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
