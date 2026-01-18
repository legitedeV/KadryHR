"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { apiResetPassword } from "@/lib/api";
import { BrandLogoMotion } from "@/components/brand/BrandLogoMotion";

function parseError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.kind === "timeout" || err.kind === "network") {
      return "Brak połączenia";
    }
    if (err.status === 400) {
      return err.message || "Link resetu jest nieprawidłowy lub wygasł";
    }
    if (err.status && err.status >= 500) {
      return "Błąd serwera";
    }
    return err.message || "Nie udało się zresetować hasła";
  }
  return err instanceof Error ? err.message : "Nie udało się zresetować hasła";
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Brak tokenu resetu hasła.");
      return;
    }
    if (password.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);
    try {
      await apiResetPassword({ token, password });
      setSuccess(true);
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
          Ustaw nowe hasło
        </h1>
        <p className="text-sm text-surface-400 text-center mb-6">
          Wprowadź nowe hasło dla swojego konta.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-800/50">
              Hasło zostało zaktualizowane. Możesz się teraz zalogować.
            </div>
            <Link href="/login" className="btn-primary w-full justify-center py-3">
              Przejdź do logowania
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-200">
                Nowe hasło
              </label>
              <input
                type="password"
                required
                className="input-field h-12 pr-4 text-left"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-200">
                Potwierdź hasło
              </label>
              <input
                type="password"
                required
                className="input-field h-12 pr-4 text-left"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
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

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? "Zapisywanie..." : "Zapisz nowe hasło"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-surface-800 text-center text-sm text-surface-400">
          <p>
            Wróć na{" "}
            <Link href="/" className="font-medium text-brand-400 hover:text-brand-300">
              stronę startową
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
