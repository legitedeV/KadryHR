import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const weekdays = [
  { value: 1, label: 'Poniedziałek', short: 'Pn' },
  { value: 2, label: 'Wtorek', short: 'Wt' },
  { value: 3, label: 'Środa', short: 'Śr' },
  { value: 4, label: 'Czwartek', short: 'Czw' },
  { value: 5, label: 'Piątek', short: 'Pt' },
  { value: 6, label: 'Sobota', short: 'So' },
  { value: 0, label: 'Niedziela', short: 'Nd' },
];

const presetSuggestions = [
  {
    id: 'preset-1',
    dayLabel: '1.01',
    title: 'Wolne',
    detail: 'Święto - brak zmian',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  {
    id: 'preset-2',
    dayLabel: '2.01',
    title: 'Rano',
    detail: 'Poranna zmiana 06:00-14:00',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  {
    id: 'preset-3',
    dayLabel: '3.01',
    title: 'Praca 8-14:30',
    detail: 'Standardowe godziny dzienne',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
];

const ScheduleBuilder = () => {
  const [form, setForm] = useState({
    month: '',
    startTime: '08:00',
    endTime: '16:00',
    employeeIds: [],
    daysOfWeek: [1, 2, 3, 4, 5],
  });

  const [shiftSuggestions, setShiftSuggestions] = useState(presetSuggestions);
  const [suggestionDraft, setSuggestionDraft] = useState({
    dayLabel: '',
    title: '',
    detail: '',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
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

  const handleAddSuggestion = () => {
    if (!suggestionDraft.dayLabel || !suggestionDraft.title) return;

    setShiftSuggestions((prev) => [
      ...prev,
      { ...suggestionDraft, id: `draft-${Date.now()}` },
    ]);

    setSuggestionDraft({
      dayLabel: '',
      title: '',
      detail: '',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    });
  };

  const weekPreviewDays = useMemo(() => {
    if (!form.month) return [];

    const [year, month] = form.month.split('-').map(Number);
    if (!year || !month) return [];

    const firstDay = new Date(year, month - 1, 1);
    return Array.from({ length: 7 }).map((_, idx) => {
      const current = new Date(firstDay);
      current.setDate(firstDay.getDate() + idx);

      return {
        label: `${weekdays[current.getDay()].short} ${current
          .toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}`,
        dayNumber: current.getDate(),
      };
    });
  }, [form.month]);

  const suggestionForDay = (dayNumber) =>
    shiftSuggestions.find((s) => Number.parseInt(s.dayLabel, 10) === dayNumber);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">Kreator grafiku miesięcznego</h1>
        <p className="text-sm text-slate-600">
          Wersja inspirowana podglądem z widoku 1 – oddzielony panel Admin / Pracownik i szybkie sugestie dni
          (np. 1.01 wolne, 2.01 rano, 3.01 praca 8-14:30). W kolejnych iteracjach dopracujemy UI w stronę widoku 2.
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
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

            <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Podgląd tygodnia</div>
                  <p className="text-[11px] text-slate-500">Układ zbliżony do widoku nr 1 – rzędy pracowników, kolumny dni.</p>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700">{form.startTime} - {form.endTime}</span>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left text-[11px] font-semibold text-slate-600 pb-2 pr-3">Pracownik</th>
                      {weekPreviewDays.map((day) => (
                        <th key={day.label} className="text-left text-[11px] font-semibold text-slate-600 pb-2 pr-3">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(employees.length ? employees : [{ _id: 'placeholder', firstName: 'Brak pracowników', lastName: '', position: '' }])
                      .slice(0, 6)
                      .map((emp) => (
                        <tr key={emp._id} className="align-top">
                          <td className="py-2 pr-3">
                            <div className="text-[11px] font-semibold text-slate-800">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[10px] text-slate-500">{emp.position}</div>
                          </td>
                          {weekPreviewDays.map((day) => {
                            const suggestion = suggestionForDay(day.dayNumber);
                            return (
                              <td key={`${emp._id}-${day.label}`} className="py-2 pr-3">
                                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
                                  <div className="text-[11px] font-semibold text-slate-800">{form.startTime} - {form.endTime}</div>
                                  <div className="text-[10px] text-slate-500">Standard</div>
                                  {suggestion && (
                                    <div className={`mt-1 inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold ${suggestion.color}`}>
                                      {suggestion.title}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Sugestie dla grafiku</div>
                  <p className="text-[11px] text-slate-500">Wersja demo na bazie Twoich uwag: 1.01 wolne, 2.01 rano, 3.01 8-14:30.</p>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700">Lista dnia</span>
              </div>

              <div className="space-y-2">
                {shiftSuggestions.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between rounded-lg border px-3 py-2 ${item.color}`}
                  >
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide">{item.dayLabel}</div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className="text-[11px] text-slate-600">{item.detail}</div>
                    </div>
                  </div>
                ))}
                {shiftSuggestions.length === 0 && (
                  <div className="text-xs text-slate-500">Brak sugestii – dodaj własne poniżej.</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900 mb-2">Dodaj własną sugestię</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Dzień (np. 5.01)"
                  value={suggestionDraft.dayLabel}
                  onChange={(e) => setSuggestionDraft((p) => ({ ...p, dayLabel: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Tytuł (np. zmiana popołudniowa)"
                  value={suggestionDraft.title}
                  onChange={(e) => setSuggestionDraft((p) => ({ ...p, title: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <input
                type="text"
                placeholder="Szczegóły / godziny"
                value={suggestionDraft.detail}
                onChange={(e) => setSuggestionDraft((p) => ({ ...p, detail: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={suggestionDraft.color}
                onChange={(e) => setSuggestionDraft((p) => ({ ...p, color: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bg-amber-100 text-amber-700 border-amber-200">Żółte</option>
                <option value="bg-sky-100 text-sky-700 border-sky-200">Niebieskie</option>
                <option value="bg-emerald-100 text-emerald-700 border-emerald-200">Zielone</option>
                <option value="bg-rose-100 text-rose-700 border-rose-200">Czerwone</option>
              </select>
              <button
                type="button"
                onClick={handleAddSuggestion}
                className="mt-3 w-full rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Dodaj sugestię
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleBuilder;
