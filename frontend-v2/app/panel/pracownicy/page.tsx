"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiListEmployees,
  type EmployeeRecord,
  type PaginatedResponse,
} from "@/lib/api";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { pushToast } from "@/lib/toast";

// Employee form data type
interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
}

// Document metadata type (for display without actual file storage)
interface DocumentMetadata {
  id: string;
  name: string;
  description?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

// Employee detail type with additional fields
interface EmployeeDetail extends EmployeeRecord {
  documents?: DocumentMetadata[];
}

type ViewMode = "list" | "add" | "edit" | "view";

const ITEMS_PER_PAGE = 10;

export default function PracownicyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<EmployeeRecord | null>(null);

  // Fetch employees list
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<EmployeeRecord> = await apiListEmployees({
        page,
        take: ITEMS_PER_PAGE,
        search: search || undefined,
        status: statusFilter,
        sortBy: "lastName",
        sortOrder: "asc",
      });
      setEmployees(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania listy pracowników");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
    });
    setFormError(null);
    setSelectedEmployee(null);
  };

  // Handle add employee
  const handleAdd = () => {
    resetForm();
    setViewMode("add");
  };

  // Handle edit employee
  const handleEdit = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      position: employee.position ?? "",
    });
    setViewMode("edit");
  };

  // Handle view employee details
  const handleView = async (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setViewMode("view");
    
    // Fetch documents for this employee
    try {
      apiClient.hydrateFromStorage();
      const docs = await apiClient.request<DocumentMetadata[]>(
        `/employees/${employee.id}/documents`,
        { suppressToast: true }
      );
      setSelectedEmployee((prev) => prev ? { ...prev, documents: docs } : null);
    } catch {
      // Documents might not be available, that's ok
      setSelectedEmployee((prev) => prev ? { ...prev, documents: [] } : null);
    }
  };

  // Handle form submit (add/edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      apiClient.hydrateFromStorage();
      
      if (viewMode === "add") {
        await apiClient.request("/employees", {
          method: "POST",
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            position: formData.position.trim() || undefined,
          }),
        });
      } else if (viewMode === "edit" && selectedEmployee) {
        await apiClient.request(`/employees/${selectedEmployee.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            position: formData.position.trim() || undefined,
          }),
        });
      }

      setViewMode("list");
      resetForm();
      fetchEmployees();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle suspend/activate employee
  const handleToggleStatus = async (employee: EmployeeRecord) => {
    setActionLoading(employee.id);
    try {
      apiClient.hydrateFromStorage();
      const endpoint = employee.isActive
        ? `/employees/${employee.id}/deactivate`
        : `/employees/${employee.id}/activate`;
      
      await apiClient.request(endpoint, { method: "PATCH" });
      pushToast({
        title: employee.isActive ? "Pracownik zawieszony" : "Pracownik aktywowany",
        variant: "success",
      });
      fetchEmployees();
    } catch (err) {
      pushToast({
        title: "Wystąpił błąd",
        description: err instanceof Error ? err.message : "Nie udało się zmienić statusu pracownika",
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete employee - open confirmation modal
  const handleDeleteClick = (employee: EmployeeRecord) => {
    setDeleteConfirmEmployee(employee);
  };

  // Confirm delete employee
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmEmployee) return;

    setActionLoading(deleteConfirmEmployee.id);
    try {
      apiClient.hydrateFromStorage();
      await apiClient.request(`/employees/${deleteConfirmEmployee.id}`, { method: "DELETE" });
      pushToast({
        title: "Pracownik usunięty",
        description: `${deleteConfirmEmployee.firstName} ${deleteConfirmEmployee.lastName} został usunięty`,
        variant: "success",
      });
      fetchEmployees();
    } catch (err) {
      pushToast({
        title: "Wystąpił błąd",
        description: err instanceof Error ? err.message : "Nie udało się usunąć pracownika",
        variant: "error",
      });
    } finally {
      setActionLoading(null);
      setDeleteConfirmEmployee(null);
    }
  };

  // Cancel and return to list
  const handleCancel = () => {
    setViewMode("list");
    resetForm();
  };

  // Pagination
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render employee list
  const renderList = () => (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Pracownicy</h1>
          <p className="text-sm text-surface-600 mt-1">
            Zarządzaj pracownikami organizacji
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Dodaj pracownika
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Szukaj po imieniu, nazwisku, emailu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="panel-input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "active" | "inactive" | "all");
            setPage(1);
          }}
          className="panel-input w-full sm:w-auto"
        >
          <option value="all">Wszyscy</option>
          <option value="active">Aktywni</option>
          <option value="inactive">Nieaktywni</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm text-surface-600">Ładowanie pracowników...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="card border-red-200 bg-red-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-3 text-sm text-red-700">{error}</p>
          <button onClick={fetchEmployees} className="btn-secondary mt-4">
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && employees.length === 0 && (
        <EmptyState
          title="Brak pracowników"
          description={search ? "Nie znaleziono pracowników spełniających kryteria wyszukiwania" : "Dodaj pierwszego pracownika, aby rozpocząć"}
          action={
            !search && (
              <button onClick={handleAdd} className="btn-primary mt-4">
                Dodaj pracownika
              </button>
            )
          }
        />
      )}

      {/* Employees table */}
      {!loading && !error && employees.length > 0 && (
        <>
          <div className="card overflow-hidden">
            <table className="panel-table w-full">
              <thead className="bg-surface-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-700">
                    Pracownik
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-700 sm:table-cell">
                    Stanowisko
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-700 md:table-cell">
                    Email / Telefon
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-700">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-brand-700">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-surface-600 sm:hidden">
                            {employee.position ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-surface-700 sm:table-cell">
                      {employee.position ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="text-sm">
                        {employee.email && (
                          <p className="text-surface-700">{employee.email}</p>
                        )}
                        {employee.phone && (
                          <p className="text-surface-600">{employee.phone}</p>
                        )}
                        {!employee.email && !employee.phone && (
                          <span className="text-surface-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          employee.isActive && !employee.isDeleted
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {employee.isActive && !employee.isDeleted ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(employee)}
                          className="rounded-md p-1.5 text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                          title="Szczegóły"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="rounded-md p-1.5 text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                          title="Edytuj"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          disabled={actionLoading === employee.id}
                          className="rounded-md p-1.5 text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors disabled:opacity-50"
                          title={employee.isActive ? "Zawieś" : "Aktywuj"}
                        >
                          {actionLoading === employee.id ? (
                            <span className="h-5 w-5 block animate-spin rounded-full border-2 border-surface-400 border-t-transparent" />
                          ) : employee.isActive ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          disabled={actionLoading === employee.id}
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Usuń"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-surface-600">
                Pokazano {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} z {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="panel-button disabled:opacity-50"
                >
                  Poprzednia
                </button>
                <span className="px-3 text-sm text-surface-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="panel-button disabled:opacity-50"
                >
                  Następna
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  // Render add/edit form
  const renderForm = () => (
    <>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-surface-600">
        <button
          onClick={handleCancel}
          className="hover:text-surface-900 transition-colors"
        >
          Pracownicy
        </button>
        <span>/</span>
        <span className="text-surface-900">
          {viewMode === "add" ? "Dodaj pracownika" : "Edytuj pracownika"}
        </span>
      </nav>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-6">
          {viewMode === "add" ? "Nowy pracownik" : `Edycja: ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
        </h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Imię <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData((d) => ({ ...d, firstName: e.target.value }))}
                className="panel-input"
                placeholder="Jan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Nazwisko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData((d) => ({ ...d, lastName: e.target.value }))}
                className="panel-input"
                placeholder="Kowalski"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                className="panel-input"
                placeholder="jan.kowalski@firma.pl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                className="panel-input"
                placeholder="+48 123 456 789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Stanowisko
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData((d) => ({ ...d, position: e.target.value }))}
              className="panel-input"
              placeholder="np. Kierownik zmiany"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={formLoading}
              className="btn-secondary"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="btn-primary"
            >
              {formLoading ? "Zapisywanie..." : viewMode === "add" ? "Dodaj pracownika" : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </>
  );

  // Render employee detail view
  const renderDetail = () => {
    if (!selectedEmployee) return null;

    return (
      <>
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-surface-600">
          <button
            onClick={handleCancel}
            className="hover:text-surface-900 transition-colors"
          >
            Pracownicy
          </button>
          <span>/</span>
          <span className="text-surface-900">
            {selectedEmployee.firstName} {selectedEmployee.lastName}
          </span>
        </nav>

        <div className="space-y-6">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-brand-700">
                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-surface-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <p className="text-surface-600">
                    {selectedEmployee.position ?? "Brak stanowiska"}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      selectedEmployee.isActive && !selectedEmployee.isDeleted
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedEmployee.isActive && !selectedEmployee.isDeleted ? "Aktywny" : "Nieaktywny"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(selectedEmployee)}
                  className="btn-secondary"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedEmployee)}
                  disabled={actionLoading === selectedEmployee.id}
                  className="btn-secondary"
                >
                  {actionLoading === selectedEmployee.id
                    ? "..."
                    : selectedEmployee.isActive
                    ? "Zawieś"
                    : "Aktywuj"}
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact info */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-600 mb-4">
                Dane kontaktowe
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-surface-600">Email</dt>
                  <dd className="text-surface-900">{selectedEmployee.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-surface-600">Telefon</dt>
                  <dd className="text-surface-900">{selectedEmployee.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-surface-600">Lokalizacje</dt>
                  <dd className="text-surface-900">
                    {selectedEmployee.locations?.length > 0
                      ? selectedEmployee.locations.map((l) => l.name).join(", ")
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Employment info */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-600 mb-4">
                Informacje o zatrudnieniu
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-surface-600">Data utworzenia</dt>
                  <dd className="text-surface-900">
                    {new Date(selectedEmployee.createdAt).toLocaleDateString("pl-PL")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-surface-600">Ostatnia aktualizacja</dt>
                  <dd className="text-surface-900">
                    {new Date(selectedEmployee.updatedAt).toLocaleDateString("pl-PL")}
                  </dd>
                </div>
                {selectedEmployee.employmentEndDate && (
                  <div>
                    <dt className="text-xs text-surface-600">Data zakończenia zatrudnienia</dt>
                    <dd className="text-surface-900">
                      {new Date(selectedEmployee.employmentEndDate).toLocaleDateString("pl-PL")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Documents section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-600">
                Teczka pracownicza / Dokumenty
              </h3>
            </div>
            
            {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
              <div className="space-y-2">
                {selectedEmployee.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-8 w-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div>
                        <p className="font-medium text-surface-900">{doc.name}</p>
                        <p className="text-xs text-surface-600">
                          {doc.filename} • {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-6 text-center">
                <svg className="mx-auto h-10 w-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="mt-2 text-sm text-surface-600">Brak dokumentów</p>
                <p className="mt-1 text-xs text-surface-500">
                  Dokumenty można dodać przez API lub panel administratora
                </p>
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="flex items-center justify-end">
            <button onClick={handleCancel} className="btn-secondary">
              Powrót do listy
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      {viewMode === "list" && renderList()}
      {(viewMode === "add" || viewMode === "edit") && renderForm()}
      {viewMode === "view" && renderDetail()}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirmEmployee}
        title="Potwierdź usunięcie"
        description={deleteConfirmEmployee ? `Czy na pewno chcesz usunąć pracownika ${deleteConfirmEmployee.firstName} ${deleteConfirmEmployee.lastName}?` : ""}
        onClose={() => setDeleteConfirmEmployee(null)}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteConfirmEmployee(null)}
              className="btn-secondary"
              disabled={actionLoading === deleteConfirmEmployee?.id}
            >
              Anuluj
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="btn-danger"
              disabled={actionLoading === deleteConfirmEmployee?.id}
            >
              {actionLoading === deleteConfirmEmployee?.id ? "Usuwanie..." : "Usuń pracownika"}
            </button>
          </>
        }
      >
        <p className="text-sm text-surface-400">
          Ta operacja jest nieodwracalna. Pracownik zostanie trwale usunięty z systemu, chyba że ma powiązane dane (grafiki, dokumenty itp.), wtedy zostanie oznaczony jako nieaktywny.
        </p>
      </Modal>
    </div>
  );
}
