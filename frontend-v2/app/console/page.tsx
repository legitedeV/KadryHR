"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetAdminStats, AdminStats } from "@/lib/api";
import { pushToast } from "@/lib/toast";

export default function ConsoleOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiGetAdminStats()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Nie udało się pobrać statystyk.";
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

  const quickLinks = [
    { href: "/console/website", label: "Website CMS", description: "Zarządzaj treściami marketingowymi." },
    { href: "/console/frontend", label: "Frontend Config", description: "Bezpieczne flagi UI i motywy." },
    { href: "/console/backend", label: "Backend Config", description: "Konfiguracja systemowa i limity." },
    { href: "/console/status", label: "Status", description: "Health checks i infrastruktura." },
    { href: "/console/github", label: "GitHub & Deploy", description: "Przegląd zmian i release'ów." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Admin Console</h1>
        <p className="text-sm text-surface-400 mt-1">
          Centrum dowodzenia platformy KadryHR — konfiguracja, CMS i monitoring.
        </p>
      </div>

      <section className="panel-card p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Przegląd systemu</h2>
        {loading && (
          <div className="text-sm text-surface-400">Ładowanie statystyk...</div>
        )}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Organizacje", value: stats.totalOrganisations },
              { label: "Pracownicy", value: stats.totalEmployees },
              { label: "Użytkownicy", value: stats.totalUsers },
              { label: "Zmiany", value: stats.totalShifts },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-surface-800/70 bg-surface-900/40 p-4">
                <p className="text-xs uppercase tracking-wide text-surface-500">{item.label}</p>
                <p className="text-2xl font-semibold text-surface-50 mt-2">
                  {item.value.toLocaleString("pl-PL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Szybkie moduły</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="panel-card p-5 border border-surface-800/70 hover:border-brand-700/50 hover:bg-surface-900/60 transition-colors"
            >
              <p className="text-sm font-semibold text-surface-100">{item.label}</p>
              <p className="text-xs text-surface-400 mt-2">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
