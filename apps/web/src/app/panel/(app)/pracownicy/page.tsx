"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api, Employee } from "@/lib/api";

type EmployeeFormState = {
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
};

const emptyForm: EmployeeFormState = {
  firstName: "",
  lastName: "",
  employeeCode: "",
  email: "",
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: api.getEmployees,
  });

  const createMutation = useMutation({
    mutationFn: api.createEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeFormState> }) =>
      api.updateEmployee(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeCode: employee.employeeCode ?? "",
      email: employee.email ?? "",
    });
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleChange = (field: keyof EmployeeFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Uzupełnij imię i nazwisko.");
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      employeeCode: form.employeeCode.trim() || undefined,
      email: form.email.trim() || undefined,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać pracownika.";
      setError(message);
    }
  };

  const handleDelete = async (employeeId: string) => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(employeeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć pracownika.";
      setError(message);
    }
  };

  const employees = useMemo(() => employeesQuery.data ?? [], [employeesQuery.data]);

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-emerald-950">Pracownicy</h1>
            <p className="mt-2 text-emerald-700">Zarządzaj listą pracowników i ich danymi.</p>
          </div>
          <KadryButton onClick={openCreate}>Dodaj pracownika</KadryButton>
        </div>

        {employeesQuery.isError ? (
          <KadryCard className="p-5">
            <p className="text-sm text-red-600">Nie udało się pobrać pracowników.</p>
          </KadryCard>
        ) : null}

        {error ? (
          <KadryCard className="p-4">
            <p className="text-sm text-red-600">{error}</p>
          </KadryCard>
        ) : null}

        <KadryCard className="overflow-x-auto p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-emerald-700">
                <th className="py-2 pr-4">Imię</th>
                <th className="py-2 pr-4">Nazwisko</th>
                <th className="py-2 pr-4">Kod</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-emerald-100">
                  <td className="py-3 pr-4 text-emerald-950">{employee.firstName}</td>
                  <td className="py-3 pr-4 text-emerald-950">{employee.lastName}</td>
                  <td className="py-3 pr-4 text-emerald-800">{employee.employeeCode ?? "-"}</td>
                  <td className="py-3 pr-4 text-emerald-800">{employee.email ?? "-"}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={() => openEdit(employee)}
                      >
                        Edytuj
                      </button>
                      <button
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(employee.id)}
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-emerald-700">
                    Brak pracowników. Dodaj pierwszego pracownika.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </KadryCard>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-950">
                {editing ? "Edytuj pracownika" : "Dodaj pracownika"}
              </h2>
              <button className="text-sm text-emerald-600" onClick={closeModal}>
                Zamknij
              </button>
            </div>
            <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-emerald-900">
                Imię
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Nazwisko
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Kod pracownika
                <input
                  type="text"
                  value={form.employeeCode}
                  onChange={handleChange("employeeCode")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex justify-end gap-3">
                <KadryButton type="button" variant="ghost" onClick={closeModal}>
                  Anuluj
                </KadryButton>
                <KadryButton type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? "Zapisz" : "Dodaj"}
                </KadryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
