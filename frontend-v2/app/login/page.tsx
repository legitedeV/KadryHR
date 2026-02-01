"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
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

function parseError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.kind === "timeout" || err.kind === "network") {
      return "Brak połączenia";
    }
    if (err.status === 401 || err.status === 403) {
      return "Nieprawidłowe dane";
    }
    if (err.status && err.status >= 500) {
      return "Błąd serwera";
    }
    return err.message || "Błąd logowania";
  }
  return err instanceof Error ? err.message : "Błąd logowania";
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolveRedirectPath(searchParams.get("redirect"));
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const oauthError = parseOAuthError(searchParams.get("error"));
  const oauthRequestId = searchParams.get("requestId");
  const disabled = loading || !!oauthLoading || !email || !password;

  function handleOAuthLogin() {
    if (oauthLoading) return;
    setOauthLoading("google");
    const redirect = encodeURIComponent(redirectTo);
    window.location.href = `/api/auth/oauth/google/start?redirect=${redirect}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirectTo);
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-surface-200">
              Hasło
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
                <svg className="h-5 w-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                required
                className="input-field input-field-with-icon h-12 pr-4 text-left"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                Nie pamiętasz hasła?
              </Link>
            </div>
          </div>

          {(error || oauthError) && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-950/50 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-800/50">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="space-y-1">
                <div>{error ?? oauthError}</div>
                {oauthRequestId && (
                  <div className="text-xs text-rose-300/80">Request ID: {oauthRequestId}</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              className="btn-secondary w-full justify-center py-3"
              onClick={handleOAuthLogin}
              disabled={!!oauthLoading}
            >
              {oauthLoading === "google" ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Przekierowanie...
                </>
              ) : (
                <span className="inline-flex items-center gap-3">
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
              )}
            </button>
            <p className="text-xs text-surface-500 text-center">
              Za pierwszym razem utworzymy konto automatycznie.
            </p>
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-surface-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] text-surface-500">
              <span className="bg-surface-950 px-3">lub</span>
            </div>
          </div>

          <button type="submit" disabled={disabled} className="btn-primary w-full justify-center py-3">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logowanie...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Zaloguj
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-800 space-y-2 text-center text-sm text-surface-400">
          <p>
            Nie masz konta?{" "}
            <Link href="/register" className="font-medium text-brand-400 hover:text-brand-300">
              Zarejestruj się
            </Link>
            .
          </p>
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
