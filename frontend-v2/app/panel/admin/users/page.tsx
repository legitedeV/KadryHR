"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiListAdminUsers, AdminUserItem, UserRole } from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { EmptyState } from "@/components/EmptyState";

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Właściciel",
  ADMIN: "Administrator",
  MANAGER: "Manager",
  EMPLOYEE: "Pracownik",
};

const ROLE_COLORS: Record<UserRole, string> = {
  OWNER: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  ADMIN: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  MANAGER: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  EMPLOYEE: "bg-surface-800/60 text-surface-200 border-surface-700/60",
};

function formatUserName(user: AdminUserItem) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.email;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiListAdminUsers({
        page,
        perPage: PAGE_SIZE,
        role: roleFilter || undefined,
      });
      setUsers(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nie udało się pobrać listy użytkowników.";
      setError(message);
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleRoleFilterChange = (newRole: string) => {
    setRoleFilter(newRole);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-surface-400 mb-1">
            <Link href="/panel/admin" className="hover:text-surface-200">
              Panel admina
            </Link>
            <span>/</span>
            <span className="text-surface-200">Użytkownicy</span>
          </div>
          <h1 className="text-xl font-semibold text-surface-100">Wszyscy użytkownicy</h1>
          <p className="text-sm text-surface-400 mt-1">
            Lista wszystkich użytkowników ze wszystkich organizacji w systemie.
          </p>
        </div>
        <div className="text-sm text-surface-400">
          Łącznie: <span className="font-semibold text-surface-100">{total}</span> użytkowników
        </div>
      </div>

      {/* Filters */}
      <div className="panel-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="space-y-1 text-sm font-medium text-surface-200">
            Filtruj po roli
            <select
              className="input-field mt-2"
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
            >
              <option value="">Wszystkie role</option>
              <option value="OWNER">Właściciel</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Pracownik</option>
            </select>
          </label>
          {roleFilter && (
            <button
              className="btn-secondary px-3 py-2"
              onClick={() => handleRoleFilterChange("")}
            >
              Wyczyść filtr
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-surface-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm">Ładowanie użytkowników...</p>
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
                  <th className="px-6 py-3">Użytkownik</th>
                  <th className="px-6 py-3">Rola</th>
                  <th className="px-6 py-3">Organizacja</th>
                  <th className="px-6 py-3">Data utworzenia</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8">
                      <EmptyState
                        title="Brak użytkowników"
                        description={
                          roleFilter
                            ? `Nie znaleziono użytkowników z rolą "${ROLE_LABELS[roleFilter as UserRole]}".`
                            : "Nie znaleziono żadnych użytkowników w systemie."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-surface-800/60 hover:bg-surface-900/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-surface-800/80 flex items-center justify-center text-surface-300 text-sm font-semibold">
                            {formatUserName(user).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-100">{formatUserName(user)}</p>
                            <p className="text-xs text-surface-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            ROLE_COLORS[user.role]
                          }`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-surface-200">{user.organisationName}</p>
                          <p className="text-xs text-surface-500 font-mono">{user.organisationId.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-400">
                        {new Date(user.createdAt).toLocaleDateString("pl-PL")}
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
