"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EmployeeRecord,
  LocationRecord,
  SaveLocationPayload,
  apiCreateLocation,
  apiDeleteLocation,
  apiListEmployees,
  apiListLocations,
  apiUpdateLocation,
} from "@/lib/api";
import { usePermissions } from "@/lib/use-permissions";
import { pushToast } from "@/lib/toast";

export default function LokalizacjePage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("RCP_EDIT");
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LocationRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [locs, employeesRes] = await Promise.all([
          apiListLocations(),
          apiListEmployees({ take: 200 }),
        ]);
        setLocations(locs);
        setEmployees(employeesRes.data);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać lokalizacji");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const term = search.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(term) ||
        (loc.address ?? "").toLowerCase().includes(term),
    );
  }, [locations, search]);

  const handleSubmit = async (payload: SaveLocationPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await apiUpdateLocation(editing.id, payload);
        pushToast({ title: "Zaktualizowano lokalizację", variant: "success" });
      } else {
        await apiCreateLocation(payload);
        pushToast({ title: "Dodano lokalizację", variant: "success" });
      }
      const refreshed = await apiListLocations();
      setLocations(refreshed);
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd zapisu",
        description: "Nie udało się zapisać lokalizacji",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteId) return;
    setDeleting(true);
    try {
      await apiDeleteLocation(showDeleteId);
      pushToast({ title: "Usunięto lokalizację", variant: "success" });
      setLocations((prev) => prev.filter((l) => l.id !== showDeleteId));
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się usunąć lokalizacji",
        variant: "error",
      });
    } finally {
      setDeleting(false);
      setShowDeleteId(null);
    }
  };

  const startEdit = (loc: LocationRecord) => {
    setEditing(loc);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Lokalizacje</p>
          <p className="text-sm text-surface-500 dark:text-surface-400">Zarządzaj sklepami i oddziałami</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="btn-primary px-2.5 py-1.5 text-sm"
          >
            + Dodaj lokalizację
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj lokalizacji lub adresu"
          className="input text-sm w-full max-w-xs"
        />
        <p className="text-xs text-surface-500 dark:text-surface-400">Łącznie: {locations.length}</p>
      </div>

      {loading && <LocationsSkeleton />}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((loc) => (
            <div key={loc.id} className="card flex flex-col gap-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{loc.name}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{loc.address || "Brak adresu"}</p>
                </div>
                {canManage && (
                  <div className="flex gap-1 text-xs">
                    <button
                      onClick={() => startEdit(loc)}
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => setShowDeleteId(loc.id)}
                      className="btn-danger px-2 py-1 text-xs"
                    >
                      Usuń
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase text-surface-500 dark:text-surface-400">Przypisani pracownicy</p>
                {loc.employees.length === 0 ? (
                  <p className="text-xs text-surface-500 dark:text-surface-400">Brak przypisanych osób</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {loc.employees.map((emp) => (
                      <span
                        key={emp.id}
                        className="badge badge-neutral text-xs"
                      >
                        {formatName(emp)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-surface-400 dark:text-surface-500">
                Utworzono: {new Date(loc.createdAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900/50 dark:text-surface-300">
              Brak lokalizacji spełniających kryteria.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <LocationFormModal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
          submitting={saving}
          employees={employees}
          initialValue={editing ?? undefined}
        />
      )}

      {showDeleteId && (
        <ConfirmDialog
          title="Usuń lokalizację"
          description="Czy na pewno chcesz usunąć tę lokalizację?"
          confirmLabel={deleting ? "Usuwanie..." : "Usuń"}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteId(null)}
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

type LocationFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SaveLocationPayload) => Promise<void>;
  submitting: boolean;
  employees: EmployeeRecord[];
  initialValue?: LocationRecord;
};

function LocationFormModal({
  open,
  onClose,
  onSubmit,
  submitting,
  employees,
  initialValue,
}: LocationFormProps) {
  const [form, setForm] = useState<SaveLocationPayload>({
    name: initialValue?.name ?? "",
    address: initialValue?.address ?? "",
    employeeIds: initialValue?.employees.map((e) => e.id) ?? [],
  });
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: initialValue?.name ?? "",
      address: initialValue?.address ?? "",
      employeeIds: initialValue?.employees.map((e) => e.id) ?? [],
    });
  }, [initialValue]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors("Nazwa lokalizacji jest wymagana");
      return;
    }
    setErrors(null);
    await onSubmit({
      ...form,
      address: form.address || undefined,
      employeeIds: form.employeeIds ?? [],
    });
  };

  const toggleEmployee = (id: string) => {
    setForm((prev) => {
      const set = new Set(prev.employeeIds ?? []);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return { ...prev, employeeIds: Array.from(set) };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {initialValue ? "Edytuj lokalizację" : "Nowa lokalizacja"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dodaj miejsce pracy i przypisz do niego pracowników.
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
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Nazwa
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
              required
            />
          </label>

          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Adres (opcjonalnie)
            <input
              value={form.address ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring dark:border-slate-800 dark:bg-slate-950"
              placeholder="ul. Słoneczna 5, Warszawa"
            />
          </label>

          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Pracownicy</p>
            <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              {employees.length === 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Brak pracowników do przypisania.
                </p>
              )}
              {employees.map((emp) => {
                const checked = form.employeeIds?.includes(emp.id);
                return (
                  <label key={emp.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEmployee(emp.id)}
                      className="accent-brand-600"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">{formatName(emp)}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{emp.position || emp.email || "Pracownik"}</span>
                    </div>
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

function LocationsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900/70"
        />
      ))}
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
