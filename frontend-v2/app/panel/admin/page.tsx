"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetAdminStats, AdminStats } from "@/lib/api";
import { pushToast } from "@/lib/toast";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiGetAdminStats()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Nie udało się pobrać statystyk.";
        setError(message);
        pushToast({ title: "Błąd", description: message, variant: "error" });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = stats
    ? [
        {
          label: "Organizacje",
          value: stats.totalOrganisations,
          icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          href: "/panel/admin/organisations",
          color: "brand",
        },
        {
          label: "Pracownicy",
          value: stats.totalEmployees,
          icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
          href: null,
          color: "emerald",
        },
        {
          label: "Użytkownicy",
          value: stats.totalUsers,
          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
          href: "/panel/admin/users",
          color: "amber",
        },
        {
          label: "Zmiany",
          value: stats.totalShifts,
          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          href: null,
          color: "violet",
        },
      ]
    : [];

  const colorClasses = {
    brand: "bg-brand-500/15 text-brand-200 border-brand-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    violet: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Panel admina</h1>
        <p className="text-sm text-surface-400 mt-1">
          Przegląd statystyk systemowych i zarządzanie wszystkimi organizacjami i użytkownikami.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-surface-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm">Ładowanie statystyk...</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const content = (
                <div
                  className={`panel-card p-6 border ${
                    colorClasses[card.color as keyof typeof colorClasses]
                  } ${card.href ? "hover:scale-[1.02] transition-transform cursor-pointer" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-400">{card.label}</p>
                      <p className="text-3xl font-bold text-surface-50 mt-1">{card.value.toLocaleString("pl-PL")}</p>
                    </div>
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                        colorClasses[card.color as keyof typeof colorClasses]
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                  </div>
                  {card.href && (
                    <p className="text-xs text-surface-500 mt-3">Kliknij, aby zobaczyć szczegóły →</p>
                  )}
                </div>
              );

              return card.href ? (
                <Link key={card.label} href={card.href}>
                  {content}
                </Link>
              ) : (
                <div key={card.label}>{content}</div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel-card p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4">Szybkie akcje</h2>
              <div className="space-y-3">
                <Link
                  href="/panel/admin/organisations"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/50 hover:bg-surface-900/80 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-100">Przeglądaj organizacje</p>
                    <p className="text-xs text-surface-400">Lista wszystkich organizacji w systemie</p>
                  </div>
                </Link>
                <Link
                  href="/panel/admin/users"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/50 hover:bg-surface-900/80 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-100">Przeglądaj użytkowników</p>
                    <p className="text-xs text-surface-400">Lista wszystkich użytkowników w systemie</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="panel-card p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4">Informacje o panelu</h2>
              <div className="space-y-3 text-sm text-surface-300">
                <p>
                  Panel administratora pozwala na przegląd statystyk systemowych oraz zarządzanie
                  wszystkimi organizacjami i użytkownikami w systemie KadryHR.
                </p>
                <p>
                  Dostęp do tego panelu mają wyłącznie użytkownicy z rolą <span className="font-semibold text-brand-300">ADMIN</span>.
                </p>
                <div className="pt-2 border-t border-surface-800/60">
                  <p className="text-xs text-surface-500">
                    Rola ADMIN jest niezależna od ról OWNER i MANAGER — służy do administracji systemowej.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
