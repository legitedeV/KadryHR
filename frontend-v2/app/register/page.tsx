"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { pushToast } from "@/lib/toast";
import { Logo } from "@/components/brand/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const [organisationName, setOrganisationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo variant="compact" size="sm" alt="KadryHR" className="max-w-[200px]" align="column" />
            <div className="text-xs text-slate-400">Kadry i płace bez tajemnic</div>
          </div>
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

          {error && (
            <p className="text-xs text-rose-100 bg-rose-950/40 border border-rose-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-full bg-brand-500 py-2 text-sm font-medium text-white shadow-soft hover:bg-brand-600 disabled:opacity-60"
          >
            {disabled ? "Tworzenie konta..." : "Utwórz konto"}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          Masz już konto? {" "}
          <Link href="/login" className="underline underline-offset-2">
            Zaloguj się
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
