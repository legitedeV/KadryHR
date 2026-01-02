"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading, refresh, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Ładowanie profilu...</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
        Brak danych
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
          Profil
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Dane zalogowanego użytkownika
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4 space-y-2">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Podstawowe dane
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {user.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rola: {user.role}
          </p>
        </div>

        <div className="card p-4 space-y-2">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Bezpieczeństwo
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Przechowujemy token tylko w localStorage przeglądarki. Wyloguj się
            na wspólnych urządzeniach.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-100"
            >
              Wyloguj
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-100"
            >
              Odśwież profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
