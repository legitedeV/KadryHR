import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const weekdays = [
  { value: 1, label: 'Poniedziałek' },
  { value: 2, label: 'Wtorek' },
  { value: 3, label: 'Środa' },
  { value: 4, label: 'Czwartek' },
  { value: 5, label: 'Piątek' },
  { value: 6, label: 'Sobota' },
  { value: 0, label: 'Niedziela' },
];

const ScheduleBuilder = () => {
  const [form, setForm] = useState({
    month: '',
    startTime: '08:00',
    endTime: '16:00',
    employeeIds: [],
    daysOfWeek: [1, 2, 3, 4, 5],
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      return data.employees || [];
    },
  });

  const createTemplate = useMutation({
    mutationFn: (payload) => api.post('/schedule/monthly-template', payload),
  });

  const employees = useMemo(() => employeesData || [], [employeesData]);

  const toggleEmployee = (id) => {
    setForm((prev) => {
      const exists = prev.employeeIds.includes(id);
      return {
        ...prev,
        employeeIds: exists
          ? prev.employeeIds.filter((empId) => empId !== id)
          : [...prev.employeeIds, id],
      };
    });
  };

  const toggleDay = (dayValue) => {
    setForm((prev) => {
      const exists = prev.daysOfWeek.includes(dayValue);
      return {
        ...prev,
        daysOfWeek: exists
          ? prev.daysOfWeek.filter((d) => d !== dayValue)
          : [...prev.daysOfWeek, dayValue],
      };
    });
  };

  const handleSubmit = () => {
    createTemplate.mutate(form);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">Kreator grafiku miesięcznego</h1>
        <p className="text-sm text-slate-600">
          Ustaw godzinę startu i końca, wybierz pracowników oraz dni tygodnia, a reszta zostanie uzupełniona automatycznie.
        </p>
      </header>

      <div className="app-card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Miesiąc (YYYY-MM)</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Start zmiany</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Koniec zmiany</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createTemplate.isLoading}
              className="w-full rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {createTemplate.isLoading ? 'Zapisywanie...' : 'Generuj grafik'}
            </button>
            {createTemplate.isSuccess && (
              <p className="text-[11px] text-emerald-700 mt-1">Dodano wpisy: {createTemplate.data?.data?.created}</p>
            )}
            {createTemplate.isError && (
              <p className="text-[11px] text-red-600 mt-1">{createTemplate.error?.response?.data?.message || 'Błąd generatora'}</p>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">Dni tygodnia</div>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((day) => {
              const active = form.daysOfWeek.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">Pracownicy</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {employees.map((emp) => {
              const active = form.employeeIds.includes(emp._id);
              return (
                <button
                  key={emp._id}
                  type="button"
                  onClick={() => toggleEmployee(emp._id)}
                  className={`text-left rounded-lg border px-3 py-2 text-sm ${
                    active
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
                  <div className="text-[11px] text-slate-500">{emp.position}</div>
                </button>
              );
            })}
            {employees.length === 0 && (
              <div className="text-xs text-slate-500">Brak pracowników do wyboru.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleBuilder;
