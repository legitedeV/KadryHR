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
    <div className="panel-theme min-h-screen flex items-center justify-center px-4 py-12 panel-shell relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="hero-aurora" />
        <div className="floating-orb orb-slow -left-32 top-10 h-52 w-52 bg-brand-700/30" />
        <div className="floating-orb orb-fast -right-28 bottom-20 h-44 w-44 bg-accent-700/25" />
      </div>

      <div className="w-full max-w-lg panel-card p-6 space-y-6">
        <div className="flex items-center justify-center">
          <BrandLogoMotion size={56} variant="full" withPL ariaLabel="KadryHR – Kadry i płace bez tajemnic" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="btn-secondary w-full justify-center py-3 min-h-[44px]"
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
          <p className="text-xs text-[var(--text-muted)] text-center">
            Za pierwszym razem utworzymy konto automatycznie.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 text-sm text-left">
              <label className="block text-[var(--text-muted)]">
                Nazwa firmy
              </label>
              <input
                required
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                className="input-field h-12 text-left"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-[var(--text-muted)]">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field h-12 text-left"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-[var(--text-muted)]">Imię</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field h-12 text-left"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-[var(--text-muted)]">Nazwisko</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field h-12 text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 text-sm text-left">
              <label className="block text-[var(--text-muted)]">Hasło</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field h-12 text-left"
              />
            </div>
            <div className="space-y-1 text-sm text-left">
              <label className="block text-[var(--text-muted)]">Potwierdź hasło</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field h-12 text-left"
              />
            </div>
          </div>

          {(error || oauthError) && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 space-y-1">
              <p>{error ?? oauthError}</p>
              {oauthRequestId && (
                <p className="text-[11px] text-rose-500">Request ID: {oauthRequestId}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="btn-primary w-full justify-center py-3 min-h-[44px]"
          >
            {disabled ? "Tworzenie konta..." : "Utwórz konto"}
          </button>
        </form>

        <p className="text-[11px] text-[var(--text-muted)] text-center">
          Masz już konto?{" "}
          <Link href="/login" className="underline underline-offset-2 text-[var(--accent)]">
            Zaloguj się
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
