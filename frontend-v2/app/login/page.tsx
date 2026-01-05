"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { pushToast } from "@/lib/toast";

function parseError(err: unknown) {
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
  const redirectTo = searchParams.get("redirect") ?? "/panel/dashboard";
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [authLoading, user, redirectTo, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      if (loggedIn) {
        pushToast({
          title: "Zalogowano",
          description: "Witaj ponownie w KadryHR",
          variant: "success",
        });
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-lg">
              K
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                KadryHR
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logowanie do panelu grafiku i pracowników
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1 text-sm text-left">
            <label className="block text-slate-700 dark:text-slate-200">
              E-mail
            </label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1 text-sm text-left">
            <label className="block text-slate-700 dark:text-slate-200">
              Hasło
            </label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-full bg-brand-500 py-2 text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:opacity-60"
          >
            {disabled ? "Logowanie..." : "Zaloguj"}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Nie masz konta? {" "}
          <Link href="/register" className="underline underline-offset-2">
            Zarejestruj się
          </Link>
          .
        </p>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Wróć na{" "}
          <Link href="/" className="underline underline-offset-2">
            stronę startową
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
