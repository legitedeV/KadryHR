"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CreateUserPayload,
  ManagedUserRole,
  UserDirectoryEntry,
  UserRole,
  apiCreateUser,
  apiListUsers,
  apiUpdateMemberRole,
  apiUpdateUser,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { pushToast } from "@/lib/toast";

const ROLE_LABELS: Record<ManagedUserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  EMPLOYEE: "Pracownik",
};

const ROLE_OPTIONS: ManagedUserRole[] = ["ADMIN", "MANAGER", "EMPLOYEE"];

function formatUserName(user: UserDirectoryEntry) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.email;
}

function formatEmployee(user: UserDirectoryEntry) {
  if (!user.employee) return "Brak powiązania";
  const name = `${user.employee.firstName ?? ""} ${user.employee.lastName ?? ""}`.trim();
  const position = user.employee.position ? ` · ${user.employee.position}` : "";
  return `${name || "Pracownik"}${position}`;
}

export default function UzytkownicyPage() {
  const { user } = useAuth();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [loading, setLoading] = useState(hasSession);
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState<UserDirectoryEntry | null>(null);
  const [form, setForm] = useState<{
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }>({
    email: "",
    password: "",
    role: "EMPLOYEE",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (!hasSession) return;
    if (user?.role !== "OWNER") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiListUsers()
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setError("Nie udało się pobrać listy użytkowników.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, user?.role]);

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      role: "EMPLOYEE",
      firstName: "",
      lastName: "",
    });
    setEditUser(null);
  };

  const openCreate = () => {
    setSuccess(null);
    setError(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (entry: UserDirectoryEntry) => {
    setSuccess(null);
    setError(null);
    setEditUser(entry);
    setForm({
      email: entry.email,
      password: "",
      role: entry.role,
      firstName: entry.firstName ?? "",
      lastName: entry.lastName ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editUser) {
        const updates = await apiUpdateUser(editUser.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password || undefined,
        });

        if (editUser.role !== form.role && editUser.role !== "OWNER") {
          await apiUpdateMemberRole(editUser.id, { role: form.role as ManagedUserRole });
        }

        setUsers((prev) =>
          prev.map((item) =>
            item.id === editUser.id
              ? {
                  ...item,
                  ...updates,
                  role: form.role,
                }
              : item,
          ),
        );
        setSuccess("Dane użytkownika zostały zaktualizowane.");
      } else {
        const payload: CreateUserPayload = {
          email: form.email,
          password: form.password,
          role: form.role as ManagedUserRole,
          firstName: form.firstName,
          lastName: form.lastName,
        };
        const created = await apiCreateUser(payload);
        setUsers((prev) => [created, ...prev]);
        setSuccess("Nowe konto zostało utworzone i wysłano powiadomienie.");
      }

      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Nie udało się zapisać użytkownika. Sprawdź dane i spróbuj ponownie.");
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać użytkownika.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!hasSession) {
    return (
      <div className="panel-card p-8">
        <EmptyState
          title="Zaloguj się, aby kontynuować"
          description="Ta sekcja jest dostępna tylko dla właściciela organizacji."
          action={
            <Link href="/login" className="btn-primary px-4 py-2">
              Przejdź do logowania
            </Link>
          }
        />
      </div>
    );
  }

  if (user?.role !== "OWNER") {
    return (
      <div className="panel-card p-8">
        <EmptyState
          title="Brak dostępu"
          description="Lista użytkowników jest dostępna tylko dla właściciela organizacji."
          action={
            <Link href="/panel/dashboard" className="btn-primary px-4 py-2">
              Wróć do dashboardu
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-100">Użytkownicy</h1>
          <p className="text-sm text-surface-400">
            Pełny spis kont w organizacji z rolami i powiązanymi pracownikami.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary px-4 py-2"
        >
          Dodaj użytkownika
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="panel-card">
        <div className="border-b border-surface-800/70 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-surface-100">
              Lista użytkowników ({users.length})
            </p>
            <span className="text-xs text-surface-400">
              Aktualizacja: {new Date().toLocaleDateString("pl-PL")}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-surface-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-sm">Ładowanie użytkowników...</p>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Brak użytkowników"
            description="Dodaj pierwsze konto, aby rozpocząć zarządzanie zespołem."
            action={
              <button type="button" className="btn-primary px-4 py-2" onClick={openCreate}>
                Dodaj użytkownika
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-900/60 text-xs uppercase tracking-wide text-surface-400">
                <tr>
                  <th className="px-6 py-3">Użytkownik</th>
                  <th className="px-6 py-3">Rola</th>
                  <th className="px-6 py-3">Powiązany pracownik</th>
                  <th className="px-6 py-3">Data utworzenia</th>
                  <th className="px-6 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id} className="border-b border-surface-800/60">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-surface-100">
                        {formatUserName(entry)}
                      </div>
                      <div className="text-xs text-surface-400">{entry.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-surface-700/60 bg-surface-900/60 px-2.5 py-1 text-xs font-medium text-surface-200">
                        {entry.role === "OWNER" ? "Właściciel" : ROLE_LABELS[entry.role as ManagedUserRole]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-surface-300">
                      {formatEmployee(entry)}
                    </td>
                    <td className="px-6 py-4 text-surface-400">
                      {new Date(entry.createdAt).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="text-xs font-semibold text-brand-400 hover:text-brand-200"
                      >
                        Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title={editUser ? "Edytuj użytkownika" : "Dodaj użytkownika"}
        description={
          editUser
            ? "Zaktualizuj dane i rolę użytkownika."
            : "Utwórz nowe konto i wyślij użytkownikowi powiadomienie."
        }
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-outline px-4 py-2"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Anuluj
            </button>
            <button
              type="button"
              className="btn-primary px-4 py-2"
              onClick={handleSave}
              disabled={saving || !form.email || (!editUser && !form.password)}
            >
              {saving ? "Zapisywanie..." : editUser ? "Zapisz" : "Utwórz"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-surface-400">Imię</label>
              <input
                className="input-field mt-2"
                placeholder="np. Anna"
                value={form.firstName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-400">Nazwisko</label>
              <input
                className="input-field mt-2"
                placeholder="np. Kowalska"
                value={form.lastName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-400">E-mail</label>
            <input
              className="input-field mt-2"
              placeholder="email@firma.pl"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              disabled={!!editUser}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-400">Hasło</label>
            <input
              type="password"
              className="input-field mt-2"
              placeholder={editUser ? "Nowe hasło (opcjonalnie)" : "Minimum 8 znaków"}
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-400">Rola</label>
            <select
              className="input-field mt-2"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
              }
              disabled={editUser?.role === "OWNER"}
            >
              {editUser?.role === "OWNER" ? (
                <option value="OWNER">Właściciel</option>
              ) : (
                ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))
              )}
            </select>
            <p className="mt-2 text-xs text-surface-500">
              Właściciel organizacji nie może być przypisany z poziomu panelu.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
