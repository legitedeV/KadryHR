"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EmployeeRecord,
  LocationRecord,
  PaginatedResponse,
  SaveEmployeePayload,
  apiCreateEmployee,
  apiDeleteEmployee,
  apiListEmployees,
  apiListLocations,
  apiUpdateEmployee,
  apiResendInvitation,
} from "@/lib/api";
import { usePermissions } from "@/lib/use-permissions";
import { pushToast } from "@/lib/toast";

const PAGE_SIZE = 10;

type SortableColumn = "firstName" | "lastName" | "email" | "createdAt";

export default function PracownicyPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("EMPLOYEE_MANAGE");
  const [employees, setEmployees] = useState<PaginatedResponse<EmployeeRecord> | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ by: SortableColumn; order: "asc" | "desc" }>({
    by: "createdAt",
    order: "desc",
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, locRes] = await Promise.all([
          apiListEmployees({
            search,
            take: PAGE_SIZE,
            page,
            sortBy: sort.by,
            sortOrder: sort.order,
          }),
          apiListLocations(),
        ]);
        setEmployees(empRes);
        setLocations(locRes);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać listy pracowników");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, page, sort.by, sort.order]);

  const totalPages = useMemo(() => {
    if (!employees) return 1;
    return Math.max(1, Math.ceil(employees.total / employees.take));
  }, [employees]);

  const onSubmit = async (payload: SaveEmployeePayload) => {
    setSaving(true);
    try {
      if (editing) {
        await apiUpdateEmployee(editing.id, payload);
        pushToast({ title: "Zaktualizowano pracownika", variant: "success" });
      } else {
        const res = await apiCreateEmployee(payload);
        pushToast({
          title: "Dodano pracownika",
          description: res.invitationSent
            ? "Zaproszenie zostało wysłane"
            : payload.email
              ? res.invitationError || "Zaproszenie nie zostało wysłane"
              : undefined,
          variant: res.invitationSent ? "success" : payload.email ? "warning" : "success",
        });
      }
      setShowForm(false);
      setEditing(null);
      const refreshed = await apiListEmployees({
        search,
        take: PAGE_SIZE,
        page,
        sortBy: sort.by,
        sortOrder: sort.order,
      });
      setEmployees(refreshed);
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd zapisu",
        description: "Nie udało się zapisać pracownika",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!showDeleteId) return;
    setDeleting(true);
    try {
      await apiDeleteEmployee(showDeleteId);
      pushToast({ title: "Usunięto pracownika", variant: "success" });
      const refreshed = await apiListEmployees({
        search,
        take: PAGE_SIZE,
        page: Math.min(page, totalPages),
        sortBy: sort.by,
        sortOrder: sort.order,
      });
      setEmployees(refreshed);
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się usunąć pracownika",
        variant: "error",
      });
    } finally {
      setDeleting(false);
      setShowDeleteId(null);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (employee: EmployeeRecord) => {
    setEditing(employee);
    setShowForm(true);
  };

  const resendInvitation = async (employee: EmployeeRecord) => {
    if (!employee.email) return;
    setResendingId(employee.id);
    try {
      await apiResendInvitation(employee.id);
      pushToast({
        title: "Zaproszenie wysłane",
        description: `Nowe zaproszenie wysłano na ${employee.email}`,
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description:
          (err as Error)?.message ||
          "Nie udało się wysłać zaproszenia",
        variant: "error",
      });
    } finally {
      setResendingId(null);
    }
  };

  const toggleSort = (column: SortableColumn) => {
    setSort((prev) => {
      if (prev.by === column) {
        return { by: column, order: prev.order === "asc" ? "desc" : "asc" };
      }
      return { by: column, order: "asc" };
    });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Pracownicy</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Lista pracowników
          </p>
        </div>
        {canManage && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            + Dodaj pracownika
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-60 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-900"
            placeholder="Szukaj po imieniu, nazwisku lub email"
          />
          <span className="hidden sm:inline">Łącznie: {employees?.total ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={() => toggleSort("firstName")}
            className={`rounded-lg border px-3 py-2 ${
              sort.by === "firstName" ? "border-brand-300 text-brand-700" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            Sortuj wg imienia {sort.by === "firstName" ? (sort.order === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            onClick={() => toggleSort("createdAt")}
            className={`rounded-lg border px-3 py-2 ${
              sort.by === "createdAt" ? "border-brand-300 text-brand-700" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            Najnowsi {sort.by === "createdAt" ? (sort.order === "asc" ? "↑" : "↓") : ""}
          </button>
        </div>
      </div>

      {loading && <EmployeesSkeleton />}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {!loading && !error && employees && (
        <div className="card p-0 overflow-hidden">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Imię i nazwisko</th>
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Email</th>
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Stanowisko</th>
                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Lokalizacje</th>
                {canManage && <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Akcje</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.data.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {formatName(e)}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Dodano: {new Date(e.createdAt).toLocaleDateString("pl-PL")}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{e.email || "–"}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{e.position || "–"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {e.locations.length === 0 && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Brak przypisań</span>
                      )}
                      {e.locations.map((loc) => (
                        <span
                          key={loc.id}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {loc.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2 text-[11px] font-semibold">
                        <button
                          onClick={() => startEdit(e)}
                          className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                        >
                          Edytuj
                        </button>
                        {e.email && (
                          <button
                            onClick={() => resendInvitation(e)}
                            disabled={resendingId === e.id}
                            className="rounded-lg border border-brand-200 px-3 py-1 text-brand-700 hover:bg-brand-50 disabled:opacity-60 dark:border-brand-800 dark:text-brand-200 dark:hover:bg-brand-950"
                          >
                            {resendingId === e.id ? "Wysyłanie..." : "Wyślij ponownie"}
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteId(e.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {employees.data.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    Brak pracowników spełniających kryteria wyszukiwania.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>
              Strona {page} z {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
              >
                Poprzednia
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
              >
                Następna
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <EmployeeFormModal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
          submitting={saving}
          locations={locations}
          initialValue={editing ?? undefined}
        />
      )}

      {showDeleteId && (
        <ConfirmDialog
          title="Usuń pracownika"
          description="Czy na pewno chcesz usunąć tego pracownika? Operacji nie można cofnąć."
          confirmLabel={deleting ? "Usuwanie..." : "Usuń"}
          onCancel={() => setShowDeleteId(null)}
          onConfirm={onDelete}
          disabled={deleting}
        />
      )}
    </div>
  );
}

function formatName(employee: EmployeeRecord) {
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return name || employee.email || "Pracownik";
}

function EmployeesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="h-14 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900/70"
        />
      ))}
    </div>
  );
}

type EmployeeFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SaveEmployeePayload) => Promise<void>;
  submitting: boolean;
  locations: LocationRecord[];
  initialValue?: EmployeeRecord;
};

function EmployeeFormModal({
  open,
  onClose,
  onSubmit,
  submitting,
  locations,
  initialValue,
}: EmployeeFormProps) {
  const [form, setForm] = useState<SaveEmployeePayload>(() => ({
    firstName: initialValue?.firstName ?? "",
    lastName: initialValue?.lastName ?? "",
    email: initialValue?.email ?? "",
    phone: initialValue?.phone ?? "",
    position: initialValue?.position ?? "",
    locationIds: initialValue?.locations.map((l) => l.id) ?? [],
  }));
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      firstName: initialValue?.firstName ?? "",
      lastName: initialValue?.lastName ?? "",
      email: initialValue?.email ?? "",
      phone: initialValue?.phone ?? "",
      position: initialValue?.position ?? "",
      locationIds: initialValue?.locations.map((l) => l.id) ?? [],
    });
  }, [initialValue]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrors("Imię i nazwisko są wymagane");
      return;
    }
    setErrors(null);
    await onSubmit({
      ...form,
      email: form.email || undefined,
      phone: form.phone || undefined,
      position: form.position || undefined,
      locationIds: form.locationIds,
    });
  };

  const toggleLocation = (id: string) => {
    setForm((prev) => {
      const set = new Set(prev.locationIds ?? []);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return { ...prev, locationIds: Array.from(set) };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {initialValue ? "Edytuj pracownika" : "Nowy pracownik"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uzupełnij dane, a następnie zapisz zmiany.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Imię
              <input
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Nazwisko
              <input
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
                placeholder="pracownik@firma.pl"
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Telefon
              <input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
                placeholder="+48 600 000 000"
              />
            </label>
          </div>

          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Stanowisko / rola
            <input
              value={form.position}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
              placeholder="Sprzedawca, Manager..."
            />
          </label>

          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Przypisane lokalizacje</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {locations.length === 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Brak dostępnych lokalizacji. Utwórz je w zakładce Lokalizacje.
                </p>
              )}
              {locations.map((loc) => {
                const checked = form.locationIds?.includes(loc.id);
                return (
                  <label
                    key={loc.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                      checked
                        ? "border-brand-300 bg-brand-50 text-brand-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLocation(loc.id)}
                      className="accent-brand-600"
                    />
                    {loc.name}
                  </label>
                );
              })}
            </div>
          </div>

          {errors && <p className="text-xs text-rose-500">{errors}</p>}

          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-70"
            >
              {submitting ? "Zapisywanie..." : initialValue ? "Zapisz zmiany" : "Dodaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
};

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  disabled,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-4 flex justify-end gap-2 text-xs">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-70 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
