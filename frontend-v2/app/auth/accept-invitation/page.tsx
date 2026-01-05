"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoIcon } from "@/components/Logo";
import { apiAcceptInvitation, apiValidateInvitation } from "@/lib/api";
import { pushToast } from "@/lib/toast";

function parseError(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Nie udało się zaprosić";
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationForm />
    </Suspense>
  );
}

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    organisationName: string;
    invitedEmail: string;
    employee: { firstName: string; lastName: string };
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Brak tokenu zaproszenia");
        return;
      }
      try {
        const info = await apiValidateInvitation(token);
        setValidation(info);
      } catch (err) {
        setError(parseError(err));
      }
    };
    load();
  }, [token]);

  const expiresLabel = useMemo(() => {
    if (!validation?.expiresAt) return null;
    return new Date(validation.expiresAt).toLocaleString("pl-PL");
  }, [validation?.expiresAt]);

  const disabled =
    loading || !validation || !password || password !== confirmPassword || password.length < 8 || !acceptTerms;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await apiAcceptInvitation({ token, password, phone: phone || undefined, acceptTerms });
      pushToast({
        title: "Konto aktywne",
        description: "Hasło zostało ustawione. Przekierowujemy do panelu",
        variant: "success",
      });
      router.push("/panel/dashboard");
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogoIcon size={40} />
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">KadryHR</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Aktywuj swoje konto</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {validation ? (
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <p className="font-semibold">Zaproszenie do {validation.organisationName}</p>
            <p className="mt-1">Adres e-mail: {validation.invitedEmail}</p>
            <p className="mt-1">Ważne do: {expiresLabel ?? "—"}</p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {error || "Sprawdzamy zaproszenie..."}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1 text-sm text-left">
            <label className="block text-slate-700 dark:text-slate-200">Nowe hasło</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1 text-sm text-left">
            <label className="block text-slate-700 dark:text-slate-200">Potwierdź hasło</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-rose-600">Hasła muszą być identyczne</p>
            )}
          </div>

          <div className="space-y-1 text-sm text-left">
            <label className="block text-slate-700 dark:text-slate-200">Telefon (opcjonalnie)</label>
            <input
              type="tel"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+48 600 000 000"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-200">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Akceptuję <Link href="/regulamin" className="underline">regulamin</Link> i politykę prywatności
            </span>
          </label>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-full bg-brand-500 py-2 text-sm font-medium text-white shadow-soft hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? "Zapisuję..." : "Ustaw hasło i wejdź"}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Masz pytania? Skontaktuj się z osobą, która Cię zaprosiła.
        </p>
      </div>
    </div>
  );
}
