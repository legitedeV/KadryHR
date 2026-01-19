"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiListAdminOrganisations, AdminOrganisationItem } from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { EmptyState } from "@/components/EmptyState";

const PAGE_SIZE = 20;

export default function AdminOrganisationsPage() {
  const [organisations, setOrganisations] = useState<AdminOrganisationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiListAdminOrganisations({ page, perPage: PAGE_SIZE });
      setOrganisations(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nie udało się pobrać listy organizacji.";
      setError(message);
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-surface-400 mb-1">
            <Link href="/" className="hover:text-surface-200">
              Panel admina
            </Link>
            <span>/</span>
            <span className="text-surface-200">Organizacje</span>
          </div>
          <h1 className="text-xl font-semibold text-surface-100">Wszystkie organizacje</h1>
          <p className="text-sm text-surface-400 mt-1">
            Lista wszystkich organizacji zarejestrowanych w systemie.
          </p>
        </div>
        <div className="text-sm text-surface-400">
          Łącznie: <span className="font-semibold text-surface-100">{total}</span> organizacji
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-surface-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm">Ładowanie organizacji...</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="panel-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-900/60 text-xs uppercase tracking-wide text-surface-400">
                <tr>
                  <th className="px-6 py-3">Nazwa</th>
                  <th className="px-6 py-3">Kategoria</th>
                  <th className="px-6 py-3 text-center">Pracownicy</th>
                  <th className="px-6 py-3 text-center">Użytkownicy</th>
                  <th className="px-6 py-3">Data utworzenia</th>
                </tr>
              </thead>
              <tbody>
                {organisations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8">
                      <EmptyState
                        title="Brak organizacji"
                        description="Nie znaleziono żadnych organizacji w systemie."
                      />
                    </td>
                  </tr>
                ) : (
                  organisations.map((org) => (
                    <tr key={org.id} className="border-b border-surface-800/60 hover:bg-surface-900/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-300 text-sm font-semibold">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-100">{org.name}</p>
                            <p className="text-xs text-surface-500 font-mono">{org.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {org.category ? (
                          <span className="inline-flex items-center rounded-full bg-surface-800/60 px-2.5 py-1 text-xs font-medium text-surface-200">
                            {org.category}
                          </span>
                        ) : (
                          <span className="text-surface-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-200">
                          {org.employeeCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-200">
                          {org.userCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-400">
                        {new Date(org.createdAt).toLocaleDateString("pl-PL")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-800/60 px-6 py-4">
              <div className="text-sm text-surface-400">
                Strona {page} z {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-3 py-1.5 text-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Poprzednia
                </button>
                <button
                  className="btn-secondary px-3 py-1.5 text-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Następna →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
