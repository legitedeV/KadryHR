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
  const [activeTab, setActiveTab] = useState('template');

  // --- Szablon miesięczny (stary kreator) ---
  const [templateForm, setTemplateForm] = useState({
    month: '',
    startTime: '08:00',
    endTime: '16:00',
    employeeIds: [],
    daysOfWeek: [1, 2, 3, 4, 5],
  });

  // --- Inteligentne generowanie ---
  const [intelligentForm, setIntelligentForm] = useState({
    startDate: '',
    endDate: '',
    employeeIds: [],
    shiftTemplateIds: [],
    minStaffPerShift: 1,
    maxStaffPerShift: 10,
    preferredStaffPerShift: 2,
    allowOvertime: true,
    allowNightShifts: true,
    allowWeekendWork: true,
    prioritizeAvailability: true,
    prioritizeCostOptimization: false,
    budget: '',
    autoSave: false,
  });

  // --- Koszty i zgodność ---
  const [analysisForm, setAnalysisForm] = useState({
    from: '',
    to: '',
    employeeId: '',
    budget: '',
    historicalDays: 30,
    forecastDays: 30,
  });

  // === DANE POMOCNICZE ===

  // pracownicy (wersja compact)
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      return data.employees || [];
    },
  });

  const employees = useMemo(() => employeesData || [], [employeesData]);
  const employeesMap = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      map[e._id] = e;
    });
    return map;
  }, [employees]);

  // szablony zmian
  const { data: shiftTemplatesData } = useQuery({
    queryKey: ['shift-templates', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/shift-templates', {
        params: { isActive: true },
      });
      return data || [];
    },
  });

  const shiftTemplates = useMemo(() => shiftTemplatesData || [], [shiftTemplatesData]);

  // === MUTACJE / AKCJE ===

  // stary kreator: /schedule/monthly-template
  const createTemplate = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/schedule/monthly-template', payload);
      return data;
    },
  });

  // inteligentne generowanie grafiku
  const generateIntelligent = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/schedule/generate-intelligent', payload);
      return data;
    },
  });

  // analiza kosztów
  const analyzeCosts = useMutation({
    mutationFn: async ({ from, to }) => {
      const params = new URLSearchParams({ from, to }).toString();
      const { data } = await api.get(`/schedule/costs/analyze?${params}`);
      return data;
    },
  });

  // optymalizacja kosztów
  const optimizeCosts = useMutation({
    mutationFn: async ({ from, to, budget }) => {
      const { data } = await api.post('/schedule/costs/optimize', {
        from,
        to,
        budget,
      });
      return data;
    },
  });

  // prognoza kosztów
  const forecastCosts = useMutation({
    mutationFn: async ({ historicalDays, forecastDays }) => {
      const params = new URLSearchParams({
        historicalDays: String(historicalDays),
        forecastDays: String(forecastDays),
      }).toString();
      const { data } = await api.get(`/schedule/costs/forecast?${params}`);
      return data;
    },
  });

  // zgodność (pojedynczy pracownik)
  const validateCompliance = useMutation({
    mutationFn: async ({ employeeId, from, to }) => {
      const params = new URLSearchParams({ employeeId, from, to }).toString();
      const { data } = await api.get(`/schedule/validate-compliance?${params}`);
      return data;
    },
  });

  // konflikty globalnie
  const detectConflicts = useMutation({
    mutationFn: async ({ from, to }) => {
      const params = new URLSearchParams({ from, to }).toString();
      const { data } = await api.get(`/schedule/conflicts?${params}`);
      return data;
    },
  });

  // === HANDLERY: szablon miesięczny ===

  const toggleTemplateEmployee = (id) => {
    setTemplateForm((prev) => {
      const exists = prev.employeeIds.includes(id);
      return {
        ...prev,
        employeeIds: exists
          ? prev.employeeIds.filter((empId) => empId !== id)
          : [...prev.employeeIds, id],
      };
    });
  };

  const toggleTemplateDay = (dayValue) => {
    setTemplateForm((prev) => {
      const exists = prev.daysOfWeek.includes(dayValue);
      return {
        ...prev,
        daysOfWeek: exists
          ? prev.daysOfWeek.filter((d) => d !== dayValue)
          : [...prev.daysOfWeek, dayValue],
      };
    });
  };

  const handleTemplateSubmit = () => {
    if (!templateForm.month) return;
    createTemplate.mutate(templateForm);
  };

  // === HANDLERY: inteligentny grafik ===

  const toggleIntelligentEmployee = (id) => {
    setIntelligentForm((prev) => {
      const exists = prev.employeeIds.includes(id);
      return {
        ...prev,
        employeeIds: exists
          ? prev.employeeIds.filter((empId) => empId !== id)
          : [...prev.employeeIds, id],
      };
    });
  };

  const toggleIntelligentTemplate = (id) => {
    setIntelligentForm((prev) => {
      const exists = prev.shiftTemplateIds.includes(id);
      return {
        ...prev,
        shiftTemplateIds: exists
          ? prev.shiftTemplateIds.filter((tid) => tid !== id)
          : [...prev.shiftTemplateIds, id],
      };
    });
  };

  const handleGenerateIntelligent = () => {
    const { startDate, endDate } = intelligentForm;
    if (!startDate || !endDate) return;

    const constraints = {
      minStaffPerShift: intelligentForm.minStaffPerShift,
      maxStaffPerShift: intelligentForm.maxStaffPerShift,
      preferredStaffPerShift: intelligentForm.preferredStaffPerShift,
      allowOvertime: intelligentForm.allowOvertime,
      allowNightShifts: intelligentForm.allowNightShifts,
      allowWeekendWork: intelligentForm.allowWeekendWork,
      prioritizeAvailability: intelligentForm.prioritizeAvailability,
      prioritizeCostOptimization: intelligentForm.prioritizeCostOptimization,
    };

    const payload = {
      startDate: intelligentForm.startDate,
      endDate: intelligentForm.endDate,
      constraints,
      autoSave: intelligentForm.autoSave,
    };

    if (intelligentForm.employeeIds.length > 0) {
      payload.employeeIds = intelligentForm.employeeIds;
    }
    if (intelligentForm.shiftTemplateIds.length > 0) {
      payload.shiftTemplateIds = intelligentForm.shiftTemplateIds;
    }
    if (intelligentForm.budget) {
      const b = Number(intelligentForm.budget);
      if (!Number.isNaN(b)) {
        payload.budget = b;
        payload.constraints = { ...constraints, budget: b };
      }
    }

    generateIntelligent.mutate(payload);
  };

  // === HANDLERY: koszty i zgodność ===

  const hasRange = analysisForm.from && analysisForm.to;

  const handleAnalyzeCosts = () => {
    if (!hasRange) return;
    analyzeCosts.mutate({ from: analysisForm.from, to: analysisForm.to });
  };

  const handleOptimizeCosts = () => {
    if (!hasRange || !analysisForm.budget) return;
    const budget = Number(analysisForm.budget);
    if (Number.isNaN(budget)) return;
    optimizeCosts.mutate({ from: analysisForm.from, to: analysisForm.to, budget });
  };

  const handleForecastCosts = () => {
    forecastCosts.mutate({
      historicalDays: analysisForm.historicalDays,
      forecastDays: analysisForm.forecastDays,
    });
  };

  const handleValidateCompliance = () => {
    if (!hasRange || !analysisForm.employeeId) return;
    validateCompliance.mutate({
      employeeId: analysisForm.employeeId,
      from: analysisForm.from,
      to: analysisForm.to,
    });
  };

  const handleDetectConflicts = () => {
    if (!hasRange) return;
    detectConflicts.mutate({
      from: analysisForm.from,
      to: analysisForm.to,
    });
  };

  // === RENDER POMOCNICZY ===

  const renderTabButton = (key, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={[
        'px-3 py-1.5 text-xs font-semibold rounded-full transition-all',
        activeTab === key
          ? 'bg-white text-pink-700 shadow-sm'
          : 'text-slate-600 hover:text-pink-700',
      ].join(' ')}
    >
      {label}
    </button>
  );

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('pl-PL');
  };

  const intelligentResult = generateIntelligent.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Kreator grafiku i optymalizacja
            </h1>
            <p className="text-sm text-slate-600">
              Generuj grafiki, analizuj koszty i sprawdzaj zgodność z Kodeksem Pracy,
              w jednym miejscu.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
            {renderTabButton('template', 'Szablon miesiąca')}
            {renderTabButton('intelligent', 'Inteligentny grafik')}
            {renderTabButton('analysis', 'Koszty i zgodność')}
          </div>
        </div>
      </header>

      {/* === ZAKŁADKA: SZABLON MIESIĄCA === */}
      {activeTab === 'template' && (
        <div className="app-card bg-white rounded-2xl border border-pink-100 shadow-sm p-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Kreator grafiku miesięcznego</h2>
            <p className="text-xs text-slate-600">
              Ustaw godziny, wybierz pracowników i dni tygodnia. System utworzy wpisy grafiku
              na podstawie prostego szablonu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Miesiąc (YYYY-MM)
              </label>
              <input
                type="month"
                value={templateForm.month}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, month: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Start zmiany</label>
              <input
                type="time"
                value={templateForm.startTime}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, startTime: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Koniec zmiany</label>
              <input
                type="time"
                value={templateForm.endTime}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, endTime: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Dni tygodnia</div>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((day) => {
                  const active = templateForm.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleTemplateDay(day.value)}
                      className={[
                        'px-2.5 py-1 rounded-full text-xs border transition-all',
                        active
                          ? 'bg-gradient-to-r from-pink-100 to-rose-100 border-pink-200 text-pink-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300',
                      ].join(' ')}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Pracownicy</span>
                <span className="text-slate-500">
                  Wybrano: {templateForm.employeeIds.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {employees.map((emp) => {
                  const active = templateForm.employeeIds.includes(emp._id);
                  return (
                    <button
                      key={emp._id}
                      type="button"
                      onClick={() => toggleTemplateEmployee(emp._id)}
                      className={[
                        'px-2.5 py-1 rounded-full text-xs border transition-all',
                        active
                          ? 'bg-pink-600 border-pink-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-pink-300',
                      ].join(' ')}
                    >
                      {emp.firstName} {emp.lastName}
                    </button>
                  );
                })}
                {employees.length === 0 && (
                  <div className="text-xs text-slate-500">
                    Brak pracowników do wyboru.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="text-xs text-slate-500">
              Szablon utworzy zmiany dla każdego wybranego pracownika w wybrane dni
              miesiąca.
            </div>
            <button
              type="button"
              onClick={handleTemplateSubmit}
              disabled={createTemplate.isLoading || !templateForm.month}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {createTemplate.isLoading ? 'Generowanie...' : 'Utwórz grafik miesięczny'}
            </button>
          </div>

          {createTemplate.isError && (
            <div className="text-xs text-red-600">
              {createTemplate.error?.response?.data?.message ||
                'Wystąpił błąd podczas generowania grafiku.'}
            </div>
          )}

          {createTemplate.isSuccess && (
            <div className="text-xs text-emerald-600">
              {createTemplate.data?.message ||
                'Grafik miesięczny został wygenerowany.'}
            </div>
          )}
        </div>
      )}

      {/* === ZAKŁADKA: INTELIGENTNY GRAFIK === */}
      {activeTab === 'intelligent' && (
        <div className="space-y-4">
          <div className="app-card bg-white rounded-2xl border border-pink-100 shadow-sm p-4 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Inteligentne generowanie grafiku
              </h2>
              <p className="text-xs text-slate-600">
                Algorytm uwzględnia dostępność, koszty i ograniczenia Kodeksu Pracy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Od (data)
                </label>
                <input
                  type="date"
                  value={intelligentForm.startDate}
                  onChange={(e) =>
                    setIntelligentForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Do (data)
                </label>
                <input
                  type="date"
                  value={intelligentForm.endDate}
                  onChange={(e) =>
                    setIntelligentForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Budżet (opcjonalnie, PLN)
                </label>
                <input
                  type="number"
                  min="0"
                  value={intelligentForm.budget}
                  onChange={(e) =>
                    setIntelligentForm((p) => ({ ...p, budget: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Pracownicy</span>
                  <span className="text-slate-500">
                    {intelligentForm.employeeIds.length > 0
                      ? `Wybrano: ${intelligentForm.employeeIds.length}`
                      : 'Brak selekcji = wszyscy'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {employees.map((emp) => {
                    const active = intelligentForm.employeeIds.includes(emp._id);
                    return (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => toggleIntelligentEmployee(emp._id)}
                        className={[
                          'px-2.5 py-1 rounded-full text-xs border transition-all',
                          active
                            ? 'bg-pink-600 border-pink-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-pink-300',
                        ].join(' ')}
                      >
                        {emp.firstName} {emp.lastName}
                      </button>
                    );
                  })}
                  {employees.length === 0 && (
                    <div className="text-xs text-slate-500">
                      Brak pracowników do wyboru.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Szablony zmian</span>
                  <span className="text-slate-500">
                    {intelligentForm.shiftTemplateIds.length > 0
                      ? `Wybrano: ${intelligentForm.shiftTemplateIds.length}`
                      : 'Brak selekcji = wszystkie aktywne'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {shiftTemplates.map((tpl) => {
                    const active = intelligentForm.shiftTemplateIds.includes(tpl._id);
                    return (
                      <button
                        key={tpl._id}
                        type="button"
                        onClick={() => toggleIntelligentTemplate(tpl._id)}
                        className={[
                          'px-2.5 py-1 rounded-full text-xs border transition-all text-left',
                          active
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-pink-300',
                        ].join(' ')}
                      >
                        <span className="font-semibold">{tpl.name}</span>{' '}
                        <span className="opacity-80">
                          ({tpl.startTime}–{tpl.endTime})
                        </span>
                      </button>
                    );
                  })}
                  {shiftTemplates.length === 0 && (
                    <div className="text-xs text-slate-500">
                      Brak zdefiniowanych szablonów zmian.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Obsada na zmianę
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-600">
                      Minimalna liczba osób
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={intelligentForm.minStaffPerShift}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          minStaffPerShift: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-600">
                      Maksymalna liczba osób
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={intelligentForm.maxStaffPerShift}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          maxStaffPerShift: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600">
                    Preferowana obsada
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={intelligentForm.preferredStaffPerShift}
                    onChange={(e) =>
                      setIntelligentForm((p) => ({
                        ...p,
                        preferredStaffPerShift: Number(e.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Zasady generowania
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligentForm.allowOvertime}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          allowOvertime: e.target.checked,
                        }))
                      }
                    />
                    Pozwalaj na nadgodziny (zgodnie z limitem)
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligentForm.allowNightShifts}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          allowNightShifts: e.target.checked,
                        }))
                      }
                    />
                    Pozwalaj na zmiany nocne
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligentForm.allowWeekendWork}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          allowWeekendWork: e.target.checked,
                        }))
                      }
                    />
                    Pozwalaj na pracę w weekendy
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Priorytety
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligentForm.prioritizeAvailability}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          prioritizeAvailability: e.target.checked,
                        }))
                      }
                    />
                    Priorytet: dostępność pracowników
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligentForm.prioritizeCostOptimization}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          prioritizeCostOptimization: e.target.checked,
                        }))
                      }
                    />
                    Priorytet: minimalizacja kosztów
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligentForm.autoSave}
                      onChange={(e) =>
                        setIntelligentForm((p) => ({
                          ...p,
                          autoSave: e.target.checked,
                        }))
                      }
                    />
                    Po wygenerowaniu zapisz grafik do bazy
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <div className="text-xs text-slate-500">
                Jeżeli nie wybierzesz pracowników ani szablonów, system użyje wszystkich
                aktywnych pracowników i szablonów zmian.
              </div>
              <button
                type="button"
                onClick={handleGenerateIntelligent}
                disabled={
                  generateIntelligent.isLoading ||
                  !intelligentForm.startDate ||
                  !intelligentForm.endDate
                }
                className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {generateIntelligent.isLoading
                  ? 'Generowanie...'
                  : intelligentForm.autoSave
                  ? 'Generuj i zapisz grafik'
                  : 'Generuj grafik (bez zapisu)'}
              </button>
            </div>

            {generateIntelligent.isError && (
              <div className="text-xs text-red-600">
                {generateIntelligent.error?.response?.data?.message ||
                  'Wystąpił błąd podczas inteligentnego generowania grafiku.'}
              </div>
            )}
          </div>

          {intelligentResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-800">
                  Podsumowanie grafiku
                </h3>
                <div className="text-[11px] space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Łączna liczba zmian</span>
                    <span className="font-semibold">
                      {intelligentResult.metadata?.totalShifts ??
                        intelligentResult.schedule?.length ??
                        0}
                    </span>
                  </div>
                  {intelligentResult.costs && (
                    <>
                      <div className="flex justify-between">
                        <span>Łączny koszt</span>
                        <span className="font-semibold">
                          {intelligentResult.costs.totalCost?.toFixed(2)} PLN
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Łączne godziny</span>
                        <span className="font-semibold">
                          {intelligentResult.costs.totalHours?.toFixed(1)} h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Śr. koszt / godz.</span>
                        <span className="font-semibold">
                          {intelligentResult.costs.averageCostPerHour?.toFixed(2)} PLN
                        </span>
                      </div>
                    </>
                  )}
                  {intelligentResult.budgetStatus && (
                    <div className="pt-1 text-[11px]">
                      {intelligentResult.budgetStatus.status === 'ok' ? (
                        <span className="text-emerald-600">
                          Mieścisz się w budżecie o{' '}
                          {intelligentResult.budgetStatus.margin?.toFixed(2)} PLN
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Przekroczenie budżetu o{' '}
                          {intelligentResult.budgetStatus.overrun?.toFixed(2)} PLN
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-800">
                  Zgodność z Kodeksem Pracy
                </h3>
                {intelligentResult.validation?.isValid ? (
                  <div className="text-[11px] text-emerald-600">
                    Grafik nie narusza krytycznych przepisów Kodeksu Pracy.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {(intelligentResult.validation?.violations || []).map(
                      (v, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-amber-800"
                        >
                          <div className="font-semibold">
                            {v.severity?.toUpperCase()} – {v.article}
                          </div>
                          <div>{v.message}</div>
                        </div>
                      ),
                    )}
                    {(!intelligentResult.validation ||
                      !intelligentResult.validation.violations ||
                      intelligentResult.validation.violations.length === 0) && (
                      <div className="text-[11px] text-slate-500">
                        Brak danych o naruszeniach.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2 lg:col-span-1">
                <h3 className="text-xs font-semibold text-slate-800">
                  Przykładowy grafik (podgląd)
                </h3>
                <div className="max-h-48 overflow-auto text-[11px] space-y-1">
                  {(intelligentResult.schedule || [])
                    .slice(0, 40)
                    .map((shift, idx) => {
                      const emp = employeesMap[shift.employee];
                      return (
                        <div
                          key={idx}
                          className="flex justify-between gap-2 border-b border-slate-100 pb-0.5"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">
                              {emp
                                ? `${emp.firstName} ${emp.lastName}`
                                : 'Pracownik'}
                            </div>
                            <div className="text-slate-500">
                              {formatDate(shift.date)} · {shift.startTime}–
                              {shift.endTime}
                            </div>
                          </div>
                          {shift.type && (
                            <div className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 self-center">
                              {shift.type}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {(!intelligentResult.schedule ||
                    intelligentResult.schedule.length === 0) && (
                    <div className="text-[11px] text-slate-500">
                      Brak wygenerowanych zmian.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === ZAKŁADKA: KOSZTY I ZGODNOŚĆ === */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="app-card bg-white rounded-2xl border border-pink-100 shadow-sm p-4 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Analiza kosztów i zgodność z prawem
              </h2>
              <p className="text-xs text-slate-600">
                Wybierz zakres dat, a następnie skorzystaj z narzędzi analizy, optymalizacji
                i walidacji grafiku.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Od (data)
                </label>
                <input
                  type="date"
                  value={analysisForm.from}
                  onChange={(e) =>
                    setAnalysisForm((p) => ({ ...p, from: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Do (data)
                </label>
                <input
                  type="date"
                  value={analysisForm.to}
                  onChange={(e) =>
                    setAnalysisForm((p) => ({ ...p, to: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Budżet (opt. do optymalizacji, PLN)
                </label>
                <input
                  type="number"
                  min="0"
                  value={analysisForm.budget}
                  onChange={(e) =>
                    setAnalysisForm((p) => ({ ...p, budget: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Pracownik (zgodność)
                </label>
                <select
                  value={analysisForm.employeeId}
                  onChange={(e) =>
                    setAnalysisForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">— wszyscy / wybierz —</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Koszty grafiku
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyzeCosts}
                    disabled={analyzeCosts.isLoading || !hasRange}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Analizuj koszty
                  </button>
                  <button
                    type="button"
                    onClick={handleOptimizeCosts}
                    disabled={
                      optimizeCosts.isLoading || !hasRange || !analysisForm.budget
                    }
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    Optymalizuj koszty
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Prognoza kosztów
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-600">
                      Dni historyczne
                    </label>
                    <input
                      type="number"
                      min="7"
                      value={analysisForm.historicalDays}
                      onChange={(e) =>
                        setAnalysisForm((p) => ({
                          ...p,
                          historicalDays: Number(e.target.value) || 30,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-600">
                      Dni prognozy
                    </label>
                    <input
                      type="number"
                      min="7"
                      value={analysisForm.forecastDays}
                      onChange={(e) =>
                        setAnalysisForm((p) => ({
                          ...p,
                          forecastDays: Number(e.target.value) || 30,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleForecastCosts}
                  disabled={forecastCosts.isLoading}
                  className="mt-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50"
                >
                  Prognozuj koszty
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Zgodność & konflikty
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleValidateCompliance}
                    disabled={
                      validateCompliance.isLoading ||
                      !hasRange ||
                      !analysisForm.employeeId
                    }
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Sprawdź zgodność (1 pracownik)
                  </button>
                  <button
                    type="button"
                    onClick={handleDetectConflicts}
                    disabled={detectConflicts.isLoading || !hasRange}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Wykryj konflikty globalnie
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* WYNIKI ANALIZY KOSZTÓW */}
          {analyzeCosts.data && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Analiza kosztów ({formatDate(analyzeCosts.data.period?.from)} –{' '}
                {formatDate(analyzeCosts.data.period?.to)})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
                <div className="flex justify-between">
                  <span>Łączny koszt</span>
                  <span className="font-semibold">
                    {analyzeCosts.data.totalCost?.toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Łączne godziny</span>
                  <span className="font-semibold">
                    {analyzeCosts.data.totalHours?.toFixed(1)} h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nadgodziny</span>
                  <span className="font-semibold">
                    {analyzeCosts.data.totalOvertimeHours?.toFixed(1)} h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Śr. koszt / godz.</span>
                  <span className="font-semibold">
                    {analyzeCosts.data.averageCostPerHour?.toFixed(2)} PLN
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* WYNIKI OPTYMALIZACJI KOSZTÓW */}
          {optimizeCosts.data && (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Optymalizacja kosztów
              </h3>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Budżet</span>
                  <span className="font-semibold">
                    {optimizeCosts.data.budget?.toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Aktualny koszt</span>
                  <span className="font-semibold">
                    {optimizeCosts.data.currentCost?.toFixed(2)} PLN
                  </span>
                </div>
                {typeof optimizeCosts.data.savings === 'number' && (
                  <div className="flex justify-between">
                    <span>{optimizeCosts.data.needsOptimization ? 'Potencjalne oszczędności' : 'Oszczędności względem budżetu'}</span>
                    <span className="font-semibold">
                      {optimizeCosts.data.savings?.toFixed(2)} PLN
                    </span>
                  </div>
                )}
                {(optimizeCosts.data.suggestions || []).length > 0 && (
                  <div className="pt-2 space-y-1">
                    {(optimizeCosts.data.suggestions || []).map((s, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-800"
                      >
                        <div className="font-semibold capitalize">
                          {s.type} · {s.priority}
                        </div>
                        <div>{s.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WYNIKI PROGNOZY KOSZTÓW */}
          {forecastCosts.data && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Prognoza kosztów
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
                <div className="flex justify-between">
                  <span>Prognozowany koszt</span>
                  <span className="font-semibold">
                    {forecastCosts.data.forecastedCost?.toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Śr. dzienny koszt (historyczny)</span>
                  <span className="font-semibold">
                    {forecastCosts.data.dailyAverage?.toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Liczba dni historycznych</span>
                  <span className="font-semibold">
                    {forecastCosts.data.basedOnDays}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Okres prognozy</span>
                  <span className="font-semibold">
                    {forecastCosts.data.forecastPeriodDays} dni
                  </span>
                </div>
              </div>
              {forecastCosts.data.confidence && (
                <div className="text-[11px] text-slate-600">
                  Poziom zaufania modelu:{' '}
                  <span className="font-semibold">
                    {Math.round(forecastCosts.data.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* WYNIKI ZGODNOŚCI */}
          {validateCompliance.data && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Zgodność z Kodeksem Pracy – pracownik
              </h3>
              <div className="text-[11px] text-slate-700">
                <div className="flex justify-between mb-1">
                  <span>Okres</span>
                  <span className="font-semibold">
                    {formatDate(validateCompliance.data.period?.from)} –{' '}
                    {formatDate(validateCompliance.data.period?.to)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Liczba zmian</span>
                  <span className="font-semibold">
                    {validateCompliance.data.shiftsCount}
                  </span>
                </div>
                {validateCompliance.data.validation?.isValid ? (
                  <div className="text-emerald-600">
                    Brak krytycznych naruszeń w tym okresie.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {(validateCompliance.data.validation?.violations || []).map(
                      (v, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-amber-800"
                        >
                          <div className="font-semibold">
                            {v.severity?.toUpperCase()} – {v.article}
                          </div>
                          <div>{v.message}</div>
                        </div>
                      ),
                    )}
                    {(!validateCompliance.data.validation ||
                      !validateCompliance.data.validation.violations ||
                      validateCompliance.data.validation.violations.length ===
                        0) && (
                      <div className="text-[11px] text-slate-500">
                        Brak danych o naruszeniach.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WYNIKI KONFLIKTÓW */}
          {detectConflicts.data && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Konflikty w grafiku (globalnie)
              </h3>
              <div className="text-[11px] text-slate-700 mb-1">
                Znaleziono konfliktów:{' '}
                <span className="font-semibold">
                  {detectConflicts.data.conflictsFound || 0}
                </span>
              </div>
              <div className="max-h-48 overflow-auto pr-1 space-y-1">
                {(detectConflicts.data.conflicts || []).map((c, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] rounded-md bg-red-50 border border-red-200 px-2 py-1 text-red-800"
                  >
                    <div className="font-semibold">
                      {c.employeeName || 'Pracownik'} – {c.violations?.length || 0}{' '}
                      naruszeń
                    </div>
                    {(c.violations || []).slice(0, 3).map((v, id2) => (
                      <div key={id2}>
                        {v.article}: {v.message}
                      </div>
                    ))}
                    {c.violations && c.violations.length > 3 && (
                      <div className="opacity-80">
                        ... i {c.violations.length - 3} więcej
                      </div>
                    )}
                  </div>
                ))}
                {( !detectConflicts.data.conflicts ||
                  detectConflicts.data.conflicts.length === 0) && (
                  <div className="text-[11px] text-slate-500">
                    Brak wykrytych konfliktów w zadanym okresie.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BŁĘDY GLOBALNE */}
          {(analyzeCosts.isError ||
            optimizeCosts.isError ||
            forecastCosts.isError ||
            validateCompliance.isError ||
            detectConflicts.isError) && (
            <div className="text-xs text-red-600">
              {
                analyzeCosts.error?.response?.data?.message ||
                optimizeCosts.error?.response?.data?.message ||
                forecastCosts.error?.response?.data?.message ||
                validateCompliance.error?.response?.data?.message ||
                detectConflicts.error?.response?.data?.message ||
                'Wystąpił błąd podczas analizy grafiku.'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleBuilder;
