"use client";

import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import {
  EmployeeRecord,
  LocationRecord,
  SaveEmployeePayload,
  apiActivateEmployee,
  apiCreateEmployee,
  apiDeactivateEmployee,
  apiDeleteEmployee,
  apiListEmployees,
  apiListLocations,
  apiResendInvitation,
  apiUpdateEmployee,
  apiUploadEmployeeAvatar,
  apiDeleteEmployeeAvatar,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { AvatarUpload } from "@/components/AvatarUpload";
import { pushToast } from "@/lib/toast";
import { usePermissions } from "@/lib/use-permissions";

function formatEmployeeName(employee: EmployeeRecord) {
  const fullName = `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
  return fullName || employee.email || "Pracownik";
}

function formatLocations(locations: EmployeeRecord["locations"]) {
  if (!locations || locations.length === 0) return "Brak przypisania";
  return locations.map((loc) => loc.name).filter(Boolean).join(", ");
}

export default function PracownicyPage() {
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const { hasPermission } = usePermissions();
  const canManageEmployees = hasPermission("EMPLOYEE_MANAGE");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(
    hasSession ? null : "Zaloguj się, aby wyświetlić listę pracowników.",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [confirmAction, setConfirmAction] = useState<{
    employee: EmployeeRecord;
    action: "deactivate" | "activate" | "delete";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState<SaveEmployeePayload>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    locationIds: [],
  });

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;

    setLoading(true);
    apiListEmployees({ take: 50, skip: 0, status: statusFilter })
      .then((employeeResponse) => {
        if (cancelled) return;
        setEmployees(employeeResponse.data);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setError("Nie udało się pobrać listy pracowników");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, statusFilter]);

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;

    apiListLocations()
      .then((locationResponse) => {
        if (cancelled) return;
        setLocations(locationResponse);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  const activeEmployees = employees.filter((employee) => employee.isActive && !employee.isDeleted);
  const invitedEmployees = employees.filter((employee) => employee.locations.length === 0);

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", email: "", phone: "", position: "", locationIds: [] });
    setEditId(null);
    setEditAvatarUrl(null);
    setFormError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    setSuccess(null);
    try {
      if (editId) {
        const updated = await apiUpdateEmployee(editId, form);
        setEmployees((prev) => prev.map((e) => (e.id === editId ? updated : e)));
        setSuccess("Dane pracownika zostały zapisane.");
      } else {
        const { employee, invitationSent, invitationError } = await apiCreateEmployee(form);
        setEmployees((prev) => [employee, ...prev]);
        if (invitationSent) {
          setSuccess("Pracownik dodany i zaproszenie wysłane.");
        } else if (invitationError) {
          setSuccess(`Pracownik dodany. Nie udało się wysłać zaproszenia: ${invitationError}`);
        } else {
          setSuccess("Pracownik dodany.");
        }
      }
      setCreateModalOpen(false);
      resetForm();
    } catch (e) {
      console.error(e);
      setFormError("Nie udało się zapisać pracownika. Sprawdź dane i spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee: EmployeeRecord) => {
    setEditId(employee.id);
    setEditAvatarUrl(employee.avatarUrl ?? null);
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      position: employee.position ?? "",
      locationIds: employee.locations?.map((l) => l.id) ?? [],
    });
    setCreateModalOpen(true);
  };

  const handleResendInvitation = async (employeeId: string) => {
    setSaving(true);
    setSuccess(null);
    setFormError(null);
    try {
      await apiResendInvitation(employeeId);
      setSuccess("Zaproszenie zostało wysłane ponownie.");
    } catch (err) {
      console.error(err);
      setFormError("Nie udało się ponownie wysłać zaproszenia.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!editId) return;
    const result = await apiUploadEmployeeAvatar(editId, file);
    setEditAvatarUrl(result.avatarUrl);
    setEmployees((prev) =>
      prev.map((e) => (e.id === editId ? { ...e, avatarUrl: result.avatarUrl } : e)),
    );
    pushToast({
      title: "Sukces",
      description: "Zdjęcie zostało przesłane",
      variant: "success",
    });
  }, [editId]);

  const handleAvatarDelete = useCallback(async () => {
    if (!editId) return;
    await apiDeleteEmployeeAvatar(editId);
    setEditAvatarUrl(null);
    setEmployees((prev) =>
      prev.map((e) => (e.id === editId ? { ...e, avatarUrl: undefined } : e)),
    );
    pushToast({
      title: "Sukces",
      description: "Zdjęcie zostało usunięte",
      variant: "success",
    });
  }, [editId]);

  const openConfirm = (employee: EmployeeRecord, action: "deactivate" | "activate" | "delete") => {
    setConfirmAction({ employee, action });
  };

  const confirmConfig = confirmAction
    ? {
        title:
          confirmAction.action === "delete"
            ? "Usuń pracownika"
            : confirmAction.action === "deactivate"
              ? "Dezaktywuj pracownika"
              : "Aktywuj ponownie pracownika",
        description:
          confirmAction.action === "delete"
            ? "Czy na pewno chcesz usunąć pracownika? Dane historyczne (grafiki, wypłaty) mogą pozostać w systemie, ale pracownik nie będzie dostępny do dalszego planowania."
            : confirmAction.action === "deactivate"
              ? "Czy na pewno chcesz tymczasowo dezaktywować tego pracownika? Nie będzie można przypisywać go do grafiku ani logowania do systemu."
              : "Czy na pewno chcesz ponownie aktywować tego pracownika? Będzie można przypisywać go do grafiku i logować się do systemu.",
        confirmLabel:
          confirmAction.action === "delete"
            ? "Usuń"
            : confirmAction.action === "deactivate"
              ? "Dezaktywuj"
              : "Aktywuj",
      }
    : null;

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setSuccess(null);
    setFormError(null);
    try {
      if (confirmAction.action === "deactivate") {
        const updated = await apiDeactivateEmployee(confirmAction.employee.id);
        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? { ...e, ...updated, locations: e.locations } : e)),
        );
        pushToast({
          title: "Pracownik dezaktywowany",
          description: "Pracownik nie będzie już przypisywany do grafików ani logowania.",
          variant: "success",
        });
      }

      if (confirmAction.action === "activate") {
        const updated = await apiActivateEmployee(confirmAction.employee.id);
        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? { ...e, ...updated, locations: e.locations } : e)),
        );
        pushToast({
          title: "Pracownik aktywowany",
          description: "Pracownik może ponownie korzystać z systemu.",
          variant: "success",
        });
      }

      if (confirmAction.action === "delete") {
        const result = await apiDeleteEmployee(confirmAction.employee.id);
        if (result.softDeleted && result.employee) {
          const mapped = result.employee;
          setEmployees((prev) =>
            prev.map((e) =>
              e.id === confirmAction.employee.id ? { ...e, ...mapped, locations: e.locations } : e,
            ),
          );
          pushToast({
            title: "Pracownik oznaczony jako usunięty",
            description: "Historia została zachowana, pracownik jest nieaktywny.",
            variant: "success",
          });
        } else {
          setEmployees((prev) => prev.filter((e) => e.id !== confirmAction.employee.id));
          pushToast({
            title: "Pracownik usunięty",
            description: "Pracownik został trwale usunięty.",
            variant: "success",
          });
        }
      }
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setForm((prev) => {
      const alreadySelected = prev.locationIds?.includes(locationId);
      const locationIds = alreadySelected
        ? prev.locationIds?.filter((id) => id !== locationId)
        : [...(prev.locationIds ?? []), locationId];
      return { ...prev, locationIds } as SaveEmployeePayload;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Pracownicy</p>
          <p className="text-sm text-surface-500 dark:text-surface-400">Lista pracowników</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Razem: <span className="font-semibold text-surface-900 dark:text-surface-100">{employees.length}</span>
          </div>
          {canManageEmployees && (
            <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
              Dodaj pracownika
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Ładowanie pracowników...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Łącznie", value: employees.length },
              { label: "Aktywni", value: activeEmployees.length },
              { label: "Na urlopie", value: 0 },
              { label: "Zaproszeni", value: invitedEmployees.length },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.02em] text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-surface-500 dark:text-surface-400">Pokaż:</span>
            {[
              { label: "Aktywni", value: "active" },
              { label: "Nieaktywni", value: "inactive" },
              { label: "Wszyscy", value: "all" },
            ].map((option) => (
              <button
                key={option.value}
                className={`rounded-full border px-3 py-1 font-semibold transition ${
                  statusFilter === option.value
                    ? "border-brand-400 bg-brand-50 text-brand-700 shadow-soft dark:border-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "border-surface-200 bg-white text-surface-600 hover:border-brand-200 hover:text-brand-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
                }`}
                onClick={() => setStatusFilter(option.value as "active" | "inactive" | "all")}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`card p-5 flex flex-col gap-4 ${
                  !employee.isActive || employee.isDeleted ? "opacity-60 grayscale" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {employee.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={employee.avatarUrl}
                      alt={formatEmployeeName(employee)}
                      className="h-10 w-10 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-700 font-semibold text-sm dark:from-brand-900/50 dark:to-accent-900/50 dark:text-brand-300">
                      {formatEmployeeName(employee).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">{formatEmployeeName(employee)}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{employee.email ?? "Brak emaila"}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-surface-600 dark:text-surface-300">
                  <p>{employee.phone ?? "Brak telefonu"}</p>
                  <p>{employee.position ?? "Brak stanowiska"}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Lokalizacje: {formatLocations(employee.locations)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-100 px-3 py-1 text-[10px] font-semibold uppercase text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                    {employee.position ?? "Pracownik"}
                  </span>
                  {employee.isDeleted ? (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                      usunięty
                    </span>
                  ) : employee.isActive ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                      aktywny
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      nieaktywny
                    </span>
                  )}
                </div>
                {canManageEmployees && (
                  <div className="mt-auto flex flex-wrap gap-2 text-xs">
                    <button
                      className="btn-secondary px-3 py-1.5 rounded-full"
                      onClick={() => handleEdit(employee)}
                      aria-label="Edytuj"
                    >
                      Edytuj
                    </button>
                    <button
                      className="btn-ghost px-3 py-1.5 rounded-full text-brand-700 hover:text-brand-900 dark:text-brand-300"
                      onClick={() => handleResendInvitation(employee.id)}
                      aria-label="Wyślij ponownie zaproszenie"
                    >
                      Wyślij zaproszenie
                    </button>
                    {employee.isActive && !employee.isDeleted && (
                      <button
                        className="btn-ghost px-3 py-1.5 rounded-full text-amber-700 hover:text-amber-900 dark:text-amber-300"
                        onClick={() => openConfirm(employee, "deactivate")}
                      >
                        Dezaktywuj
                      </button>
                    )}
                    {(!employee.isActive || employee.isDeleted) && (
                      <button
                        className="btn-ghost px-3 py-1.5 rounded-full text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
                        onClick={() => openConfirm(employee, "activate")}
                      >
                        Aktywuj ponownie
                      </button>
                    )}
                    {!employee.isDeleted && (
                      <button
                        className="btn-ghost px-3 py-1.5 rounded-full text-rose-700 hover:text-rose-900 dark:text-rose-300"
                        onClick={() => openConfirm(employee, "delete")}
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {employees.length === 0 && (
              <div className="col-span-full card p-8 text-center">
                <EmptyState
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  }
                  title="Brak pracowników"
                  description="Dodaj członków zespołu, aby przypisać ich do grafików i wniosków."
                  action={
                    <button
                      className="btn-primary px-3 py-2 text-sm"
                      onClick={() => {
                        resetForm();
                        setCreateModalOpen(true);
                      }}
                    >
                      Dodaj pracownika
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title={editId ? "Edytuj pracownika" : "Dodaj nowego pracownika"}
        description="Uzupełnij podstawowe dane i przypisz lokalizacje."
        footer={
          <Fragment>
            <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} disabled={saving}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Zapisywanie..." : editId ? "Zapisz zmiany" : "Dodaj"}
            </button>
          </Fragment>
        }
      >
        {editId && (
          <AvatarUpload
            currentUrl={editAvatarUrl}
            onUpload={handleAvatarUpload}
            onDelete={handleAvatarDelete}
            label="Zdjęcie pracownika"
            name={`${form.firstName} ${form.lastName}`.trim() || "Pracownik"}
            disabled={saving}
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-surface-700 dark:text-surface-200">
            Imię
            <input
              className="input"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              placeholder="Jan"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-surface-700 dark:text-surface-200">
            Nazwisko
            <input
              className="input"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Kowalski"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-surface-700 dark:text-surface-200">
            Email
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="jan@firma.pl"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-surface-700 dark:text-surface-200">
            Telefon
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+48 600 000 000"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-surface-700 dark:text-surface-200 sm:col-span-2">
            Stanowisko
            <input
              className="input"
              value={form.position}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              placeholder="Barista / Kierownik"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Przypisane lokalizacje</p>
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => {
              const selected = form.locationIds?.includes(location.id);
              return (
                <button
                  type="button"
                  key={location.id}
                  onClick={() => toggleLocation(location.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selected
                      ? "border-brand-400 bg-brand-50 text-brand-700 shadow-soft dark:border-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                      : "border-surface-200 bg-white text-surface-600 hover:border-brand-200 hover:text-brand-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
                  }`}
                >
                  {location.name}
                </button>
              );
            })}
            {locations.length === 0 && <span className="text-xs text-surface-500 dark:text-surface-400">Brak zdefiniowanych lokalizacji.</span>}
          </div>
        </div>

        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            {formError}
          </div>
        )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
          {success}
        </div>
      )}
    </Modal>

    <Modal
      open={!!confirmAction}
      onClose={() => setConfirmAction(null)}
      title={confirmConfig?.title ?? ""}
      description={confirmConfig?.description ?? ""}
      footer={
        <Fragment>
          <button className="btn-secondary" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
            Anuluj
          </button>
          <button
            className={confirmAction?.action === "delete" ? "btn-danger" : "btn-primary"}
            onClick={handleConfirmAction}
            disabled={actionLoading}
          >
            {actionLoading ? "Przetwarzanie..." : confirmConfig?.confirmLabel}
          </button>
        </Fragment>
      }
    />
  </div>
  );
}
