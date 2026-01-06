"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetMe, User } from "@/lib/api";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }
    apiGetMe()
      .then(setUser)
      .catch(() => {
        setError("Nie udało się pobrać profilu");
        clearAuthTokens();
      })
      .finally(() => setLoading(false));
  }, [hasSession, router]);

  if (!hasSession) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Ładowanie profilu...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {error || "Brak danych"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label">Profil</p>
        <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
          Dane zalogowanego użytkownika
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl shadow-soft">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="section-label">Podstawowe dane</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1">
                {user.name}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">E-mail</p>
                <p className="font-semibold text-surface-900 dark:text-surface-50">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Rola</p>
                <p className="font-semibold text-surface-900 dark:text-surface-50">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Bezpieczeństwo</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Ustawienia sesji
              </p>
            </div>
          </div>
          
          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-6">
            Przechowujemy token tylko w localStorage przeglądarki. Wyloguj się
            na wspólnych urządzeniach, aby chronić swoje dane.
          </p>
          
          <button
            onClick={() => {
              clearAuthTokens();
              router.push("/login");
            }}
            className="btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Wyloguj
          </button>
        </div>
      </div>
    </div>
  );
}
