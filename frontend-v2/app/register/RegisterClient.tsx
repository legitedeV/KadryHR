"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { pushToast } from "@/lib/toast";
import { BrandLogoMotion } from "@/components/brand/BrandLogoMotion";

function resolveRedirectPath(path: string | null) {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    if (path === "/login" || path === "/register") {
      return "/panel";
    }
    return path;
  }
  return "/panel";
}

function parseOAuthError(errorCode: string | null) {
  if (!errorCode) return null;
  const normalized = errorCode.toLowerCase();
  const messages: Record<string, string> = {
    oauth_db_failed: "Nie udało się utworzyć lub połączyć konta. Spróbuj ponownie.",
    oauth_failed: "Nie udało się zalogować przez Google. Spróbuj ponownie.",
  };
  return messages[normalized] ?? "Nie udało się zalogować przez Google. Spróbuj ponownie.";
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loading } = useAuth();
  const [organisationName, setOrganisationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const oauthError = parseOAuthError(searchParams.get("error"));
  const oauthRequestId = searchParams.get("requestId");
  const redirectTo = resolveRedirectPath(searchParams.get("redirect"));

  function handleOAuthLogin() {
    const redirect = encodeURIComponent(redirectTo);
    window.location.href = `/api/auth/oauth/google/start?redirect=${redirect}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła muszą być identyczne");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        organisationName,
        firstName,
        lastName,
        email,
        password,
      });
      pushToast({
        title: "Konto utworzone",
        description: "Witamy w KadryHR!",
        variant: "success",
      });
      router.push("/panel/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zarejestrować",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || loading;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg card p-6 space-y-6">
        <div className="flex items-center justify-center">
          <BrandLogoMotion size={56} variant="full" withPL ariaLabel="KadryHR – Kadry i płace bez tajemnic" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-full border border-slate-700 bg-slate-950 py-2 text-sm font-medium text-slate-100 shadow-soft hover:border-slate-500 hover:bg-slate-900"
            onClick={handleOAuthLogin}
          >
            <span className="inline-flex items-center justify-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
                <svg viewBox="0 0 48 48" className="h-4 w-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.67 1.22 9.14 3.62l6.79-6.79C35.86 2.52 30.39 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.9 6.13C12.33 12.28 17.71 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.65-.15-3.23-.43-4.75H24v9.05h12.7c-.55 2.98-2.18 5.5-4.63 7.2l7.2 5.57c4.2-3.88 6.23-9.59 6.23-17.07z"/>
                  <path fill="#FBBC05" d="M10.46 28.35A14.5 14.5 0 0 1 9.5 24c0-1.52.26-2.98.72-4.35l-7.9-6.13A23.96 23.96 0 0 0 0 24c0 3.92.94 7.63 2.6 10.9l7.86-6.55z"/>
                  <path fill="#34A853" d="M24 48c6.39 0 11.75-2.1 15.66-5.68l-7.2-5.57c-2 1.34-4.55 2.13-8.46 2.13-6.29 0-11.64-4.26-13.55-10.08l-7.86 6.55C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </span>
              <span>Kontynuuj z Google</span>
            </span>
          </button>
          <p className="text-xs text-slate-400 text-center">
            Za pierwszym razem utworzymy konto automatycznie.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 text-sm text-left">
              <label className="block text-slate-200">
                Nazwa firmy
              </label>
              <input
                required
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-slate-200">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-slate-200">Imię</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-slate-200">Nazwisko</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 text-sm text-left">
              <label className="block text-slate-200">Hasło</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-slate-200">Potwierdź hasło</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
          </div>

          {(error || oauthError) && (
            <div className="text-xs text-rose-100 bg-rose-950/40 border border-rose-800 rounded-xl px-3 py-2 space-y-1">
              <p>{error ?? oauthError}</p>
              {oauthRequestId && (
                <p className="text-[11px] text-rose-200/80">Request ID: {oauthRequestId}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-full bg-brand-500 py-2 text-sm font-medium text-white shadow-soft hover:bg-brand-600 disabled:opacity-60"
          >
            {disabled ? "Tworzenie konta..." : "Utwórz konto"}
          </button>
        </form>

        <p className="text-[11px] text-surface-600 text-center">
          Masz już konto?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Zaloguj się
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
