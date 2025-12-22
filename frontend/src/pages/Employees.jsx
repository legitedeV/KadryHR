import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  position: '',
  hourlyRate: '',
  monthlySalary: '',
  hoursPerMonth: 160,
};

const Employees = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  const [form, setForm] = useState(defaultForm);

  // Pobieranie listy pracowników
  const { data: employeesData, isLoading, error: listError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees');
      return data;
    },
    enabled: isAdmin,
  });

  const employees = employeesData?.employees || [];

  // Mutacja dodawania pracownika
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/employees', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setForm(defaultForm);
    },
  });

  // Mutacja usuwania pracownika
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/employees/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const body = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      position: form.position,
      hourlyRate: Number(form.hourlyRate) || 0,
      monthlySalary: Number(form.monthlySalary) || 0,
      hoursPerMonth: Number(form.hoursPerMonth) || 160,
    };

    createMutation.mutate(body);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Na pewno chcesz usunąć tego pracownika?')) return;

    deleteMutation.mutate(id);
  };

  if (!isAdmin) {
    return (
      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        Tylko administrator ma dostęp do zarządzania pracownikami.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Pracownicy</h1>
          <p className="text-xs text-slate-500">
            Zarządzaj listą pracowników, stawkami i godzinami pracy.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Dodaj pracownika
        </h2>

        {createMutation.isError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {createMutation.error?.response?.data?.message || 'Nie udało się dodać pracownika. Spróbuj ponownie.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Imię
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nazwisko
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email (konto pracownika)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="pracownik@firma.pl"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Zostanie utworzone konto pracownika z tym adresem email
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stanowisko
              </label>
              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stawka godzinowa (PLN)
              </label>
              <input
                type="number"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pensja miesięczna (PLN)
              </label>
              <input
                type="number"
                name="monthlySalary"
                value={form.monthlySalary}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Godziny w miesiącu
              </label>
              <input
                type="number"
                name="hoursPerMonth"
                value={form.hoursPerMonth}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                min="0"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {createMutation.isPending ? 'Dodawanie...' : 'Dodaj pracownika'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Lista pracowników
        </h2>

        {isLoading ? (
          <p className="text-xs text-slate-500">Ładowanie...</p>
        ) : listError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {listError?.response?.data?.message || 'Nie udało się załadować listy pracowników.'}
          </div>
        ) : employees.length === 0 ? (
          <p className="text-xs text-slate-500">Brak pracowników.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="py-2 pr-4 text-left font-medium">Imię i nazwisko</th>
                    <th className="py-2 px-4 text-left font-medium">Email</th>
                    <th className="py-2 px-4 text-left font-medium">Stanowisko</th>
                    <th className="py-2 px-4 text-right font-medium">Stawka (PLN/h)</th>
                    <th className="py-2 px-4 text-right font-medium">
                      Pensja miesięczna
                    </th>
                    <th className="py-2 pl-4 text-right font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp._id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2 pr-4">
                        <div className="font-medium text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-slate-600 text-xs">
                        {emp.user?.email || '-'}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        {emp.position || '-'}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-700">
                        {emp.hourlyRate != null ? emp.hourlyRate.toFixed(2) : '-'}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-900">
                        {emp.monthlySalary != null
                          ? `${emp.monthlySalary.toFixed(2)} zł`
                          : '-'}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(emp._id)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center rounded-lg border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {employees.map((emp) => (
                <div
                  key={emp._id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.position || 'Stanowisko nieustawione'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        {emp.monthlySalary != null
                          ? `${emp.monthlySalary.toFixed(2)} zł / m-c`
                          : '-'}
                      </div>
                      {emp.hourlyRate != null && (
                        <div className="text-[11px] text-slate-500">
                          {emp.hourlyRate.toFixed(2)} zł / h
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <div>
                      <span className="font-medium">Godziny/m-c:</span>{' '}
                      {emp.hoursPerMonth != null ? emp.hoursPerMonth : '-'}
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(emp._id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center rounded-lg border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Employees;
