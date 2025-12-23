import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
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
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

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
    onSuccess: (data) => {
      queryClient.invalidateQueries(['employees']);
      setCreatedCredentials({
        email: form.email,
        password: data.temporaryPassword,
      });
      setShowSuccessModal(true);
      setForm(defaultForm);
      setGeneratedPassword('');
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password }));
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const body = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password || undefined, // Jeśli puste, backend wygeneruje
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Zostanie utworzone konto pracownika z tym adresem email
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hasło (opcjonalne)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Zostaw puste aby wygenerować automatycznie"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm focus:outline-none focus-theme transition-all duration-200"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="inline-flex items-center gap-1 rounded-xl border border-theme-light bg-white px-3 py-2 text-xs font-medium text-theme-primary hover:bg-theme-very-light transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generuj
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Hasło musi mieć min. 6 znaków. Pracownik będzie musiał zmienić hasło przy pierwszym logowaniu.
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-theme transition-all duration-200"
                min="0"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

      {/* Success Modal */}
      {showSuccessModal && createdCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
              Pracownik dodany pomyślnie!
            </h3>
            
            <p className="text-sm text-slate-600 text-center mb-4">
              Konto użytkownika zostało utworzone. Przekaż poniższe dane pracownikowi:
            </p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded-lg border border-slate-200">
                    {createdCredentials.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email)}
                    className="p-2 text-slate-400 hover:text-theme-primary transition-colors"
                    title="Kopiuj email"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hasło tymczasowe</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded-lg border border-slate-200 text-theme-primary font-semibold">
                    {createdCredentials.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password)}
                    className="p-2 text-slate-400 hover:text-theme-primary transition-colors"
                    title="Kopiuj hasło"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-amber-800 mb-1">Ważne!</p>
                  <p className="text-xs text-amber-700">
                    Pracownik będzie musiał zmienić hasło przy pierwszym logowaniu. Zapisz te dane w bezpiecznym miejscu.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedCredentials(null);
              }}
              className="w-full inline-flex justify-center items-center rounded-xl bg-theme-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
