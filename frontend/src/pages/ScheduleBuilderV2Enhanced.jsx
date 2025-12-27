import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';
import BulkScheduleOperations from '../components/BulkScheduleOperations';

const toDateKey = (date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
};

const monthLabel = (value) => {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
};

const buildDays = (value) => {
  const [year, month] = value.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  return Array.from({ length: totalDays }, (_, idx) => {
    const date = new Date(year, month - 1, idx + 1);
    return {
      key: toDateKey(date),
      day: idx + 1,
      weekday: date.toLocaleDateString('pl-PL', { weekday: 'short' }),
    };
  });
};

const StatusBadge = ({ label, color }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
    style={{ backgroundColor: `${color}22`, color }}
  >
    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </span>
);

const EnhancedAssignmentModal = ({ 
  open, 
  onClose, 
  onSave, 
  onDelete, 
  employees, 
  shiftTemplates, 
  formState, 
  setFormState, 
  loading 
}) => {
  if (!open) return null;

  const handleChange = (key) => (e) => {
    setFormState((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleBreakChange = (index, field, value) => {
    setFormState(prev => ({
      ...prev,
      breaks: prev.breaks.map((brk, idx) => 
        idx === index ? { ...brk, [field]: value } : brk
      )
    }));
  };

  const addBreak = () => {
    setFormState(prev => ({
      ...prev,
      breaks: [...(prev.breaks || []), {
        startTime: '',
        duration: 30,
        isPaid: false,
        type: 'rest',
        taken: false
      }]
    }));
  };

  const removeBreak = (index) => {
    setFormState(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, idx) => idx !== index)
    }));
  };

  const selectedTemplate = shiftTemplates.find(t => t._id === formState.shiftTemplateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">{formState.date}</p>
            <h3 className="text-lg font-semibold text-slate-900">Przypisz zmianę</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="space-y-4">
          {/* Basic Assignment Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Podstawowe informacje</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Pracownik *</label>
                <select
                  value={formState.employeeId}
                  onChange={handleChange('employeeId')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Wybierz pracownika</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Szablon zmiany *</label>
                <select
                  value={formState.shiftTemplateId}
                  onChange={handleChange('shiftTemplateId')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Wybierz szablon</option>
                  {shiftTemplates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.startTime} - {template.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Notatka</label>
              <input
                type="text"
                value={formState.notes || ''}
                onChange={handleChange('notes')}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                placeholder="np. przerwa na szkolenie"
              />
            </div>
          </div>

          {/* Break Management */}
          {selectedTemplate && selectedTemplate.breaks && selectedTemplate.breaks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">
                Przerwy (z szablonu)
              </h4>
              <div className="space-y-2">
                {selectedTemplate.breaks.map((brk, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{brk.startTime}</span>
                        <span className="text-slate-600 ml-2">- {brk.duration} min</span>
                        {brk.isPaid && <span className="text-green-600 ml-2">(płatna)</span>}
                        <span className="text-slate-500 ml-2">({brk.type})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Breaks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800 border-b pb-2 flex-1">
                Dodatkowe przerwy
              </h4>
              <button
                onClick={addBreak}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                + Dodaj przerwę
              </button>
            </div>
            {formState.breaks && formState.breaks.length > 0 && (
              <div className="space-y-2">
                {formState.breaks.map((brk, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-3">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-700">Godzina</label>
                        <input
                          type="time"
                          value={brk.startTime}
                          onChange={(e) => handleBreakChange(idx, 'startTime', e.target.value)}
                          className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-700">Czas (min)</label>
                        <input
                          type="number"
                          value={brk.duration}
                          onChange={(e) => handleBreakChange(idx, 'duration', Number(e.target.value))}
                          className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          min="5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-700">Typ</label>
                        <select
                          value={brk.type}
                          onChange={(e) => handleBreakChange(idx, 'type', e.target.value)}
                          className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                        >
                          <option value="rest">Odpoczynek</option>
                          <option value="meal">Posiłek</option>
                          <option value="other">Inna</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-1 text-[10px]">
                          <input
                            type="checkbox"
                            checked={brk.isPaid}
                            onChange={(e) => handleBreakChange(idx, 'isPaid', e.target.checked)}
                            className="rounded"
                          />
                          Płatna
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBreak(idx)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overtime Tracking */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Nadgodziny</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Godziny nadliczbowe</label>
                <input
                  type="number"
                  value={formState.overtimeHours || ''}
                  onChange={handleChange('overtimeHours')}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                  min="0"
                  step="0.5"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Status zatwierdzenia</label>
                <select
                  value={formState.overtimeApprovalStatus || 'pending'}
                  onChange={handleChange('overtimeApprovalStatus')}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="pending">Oczekuje</option>
                  <option value="approved">Zatwierdzone</option>
                  <option value="rejected">Odrzucone</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Powód nadgodzin</label>
                <input
                  type="text"
                  value={formState.overtimeReason || ''}
                  onChange={handleChange('overtimeReason')}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                  placeholder="Opcjonalnie"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Status zmiany</h4>
            <div>
              <label className="text-xs font-semibold text-slate-700">Status</label>
              <select
                value={formState.status || 'scheduled'}
                onChange={handleChange('status')}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
              >
                <option value="scheduled">Zaplanowana</option>
                <option value="confirmed">Potwierdzona</option>
                <option value="in-progress">W trakcie</option>
                <option value="completed">Zakończona</option>
                <option value="cancelled">Anulowana</option>
                <option value="no-show">Nieobecność</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
          {formState.assignmentId && (
            <button
              onClick={onDelete}
              disabled={loading}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Usuń zmianę
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Anuluj
            </button>
            <button
              onClick={onSave}
              disabled={loading || !formState.employeeId || !formState.shiftTemplateId}
              className="rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleBuilderV2Enhanced = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ type: null, message: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpsOpen, setBulkOpsOpen] = useState(false);
  const [modalState, setModalState] = useState({ 
    employeeId: '', 
    date: '', 
    shiftTemplateId: '', 
    notes: '', 
    breaks: [],
    overtimeHours: 0,
    overtimeApprovalStatus: 'pending',
    overtimeReason: '',
    status: 'scheduled'
  });

  const daysInMonth = useMemo(() => buildDays(selectedMonth), [selectedMonth]);
  const [year, month] = selectedMonth.split('-').map(Number);

  const { data: schedules } = useQuery({
    queryKey: ['schedules-v2', year, month],
    queryFn: async () => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const { data } = await api.get('/schedules/v2', { params: { month: monthStr, year } });
      return data.schedules || [];
    },
  });

  const { data: scheduleDetail, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule-v2-detail', selectedSchedule?._id],
    queryFn: async () => {
      if (!selectedSchedule) return null;
      const { data } = await api.get(`/schedules/v2/${selectedSchedule._id}`);
      return data;
    },
    enabled: !!selectedSchedule,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      return data.employees || [];
    },
  });

  const { data: shiftTemplatesData } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data } = await api.get('/shift-templates');
      return Array.isArray(data) ? data : data.templates || [];
    },
  });

  const createSchedule = useMutation({
    mutationFn: async () => {
      const name = `Grafik ${selectedMonth}`;
      const { data } = await api.post('/schedules/v2', { name, month: selectedMonth, year });
      return data.schedule;
    },
    onSuccess: (schedule) => {
      queryClient.invalidateQueries(['schedules-v2']);
      setSelectedSchedule(schedule);
      setAlert({ type: 'success', message: 'Utworzono nowy grafik na wybrany miesiąc.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się utworzyć grafiku.' }),
  });

  const createAssignment = useMutation({
    mutationFn: async ({ scheduleId, ...payload }) => {
      const { data } = await api.post(`/schedules/v2/${scheduleId}/assignments`, payload);
      return data.assignment;
    },
    onSuccess: (_data, variables) => {
      if (variables.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
      setAlert({ type: 'success', message: 'Zapisano zmianę w grafiku.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się zapisać zmiany.' }),
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/schedules/v2/assignments/${id}`, payload);
      return data.assignment;
    },
    onSuccess: (_data, variables) => {
      if (variables.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
      setAlert({ type: 'success', message: 'Zmieniono przypisanie.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się zaktualizować zmiany.' }),
  });

  const deleteAssignment = useMutation({
    mutationFn: async ({ id }) => {
      await api.delete(`/schedules/v2/assignments/${id}`);
    },
    onSuccess: (_data, variables) => {
      if (variables.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
      setAlert({ type: 'success', message: 'Usunięto zmianę z grafiku.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się usunąć zmiany.' }),
  });

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      setSelectedSchedule((prev) => prev || schedules[0]);
    } else {
      setSelectedSchedule(null);
    }
  }, [schedules]);

  const assignments = useMemo(() => scheduleDetail?.assignments || [], [scheduleDetail]);
  const assignmentsByKey = useMemo(() => {
    const map = {};
    assignments.forEach((assignment) => {
      const dateStr = toDateKey(new Date(assignment.date));
      const key = `${assignment.employee._id}-${dateStr}`;
      map[key] = assignment;
    });
    return map;
  }, [assignments]);

  const filteredEmployees = useMemo(() => {
    if (!employeesData) return [];
    const term = searchTerm.trim().toLowerCase();
    return employeesData.filter((emp) => {
      const matchesTerm = !term || `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(term);
      if (!matchesTerm) return false;

      if (statusFilter === 'planned') {
        return assignments.some((a) => a.employee._id === emp._id);
      }
      if (statusFilter === 'empty') {
        return !assignments.some((a) => a.employee._id === emp._id);
      }
      return true;
    });
  }, [employeesData, searchTerm, statusFilter, assignments]);

  const openModal = (employeeId, dateKey) => {
    setModalState((prev) => {
      const key = `${employeeId}-${dateKey}`;
      const existing = assignmentsByKey[key];
      return {
        ...prev,
        employeeId,
        date: dateKey,
        shiftTemplateId: existing?.shiftTemplate?._id || '',
        notes: existing?.notes || '',
        assignmentId: existing?._id,
        breaks: existing?.breaks || [],
        overtimeHours: existing?.overtimeHours || 0,
        overtimeApprovalStatus: existing?.overtimeApprovalStatus || 'pending',
        overtimeReason: existing?.overtimeReason || '',
        status: existing?.status || 'scheduled'
      };
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedSchedule) return;

    const selectedTemplate = shiftTemplatesData?.find((tpl) => tpl._id === modalState.shiftTemplateId);
    const startTime = selectedTemplate?.startTime;
    const endTime = selectedTemplate?.endTime;

    if (!startTime || !endTime) {
      setAlert({ type: 'error', message: 'Szablon zmiany musi zawierać godziny rozpoczęcia i zakończenia.' });
      return;
    }

    const payload = {
      scheduleId: selectedSchedule._id,
      employeeId: modalState.employeeId,
      date: modalState.date,
      shiftTemplateId: modalState.shiftTemplateId,
      notes: modalState.notes,
      startTime,
      endTime,
      breaks: modalState.breaks,
      overtimeHours: modalState.overtimeHours ? Number(modalState.overtimeHours) : 0,
      overtimeApprovalStatus: modalState.overtimeApprovalStatus,
      overtimeReason: modalState.overtimeReason,
      status: modalState.status
    };

    if (modalState.assignmentId) {
      updateAssignment.mutate({ ...payload, id: modalState.assignmentId });
    } else {
      createAssignment.mutate(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!selectedSchedule || !modalState.assignmentId) return;
    deleteAssignment.mutate({ id: modalState.assignmentId, scheduleId: selectedSchedule._id });
    setModalOpen(false);
  };

  const handleMonthChange = (direction) => {
    const date = new Date(`${selectedMonth}-01T00:00:00`);
    date.setMonth(date.getMonth() + direction);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const renderCell = (employee, day) => {
    const key = `${employee._id}-${day.key}`;
    const assignment = assignmentsByKey[key];
    const color = assignment?.shiftTemplate?.color || '#22c55e';

    return (
      <button
        key={day.key}
        onClick={() => openModal(employee._id, day.key)}
        className="group relative flex h-[4.25rem] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs transition-all duration-150 hover:-translate-y-[1px] hover:border-theme-primary hover:shadow-sm"
      >
        {assignment ? (
          <div className="flex flex-col items-center text-center leading-tight gap-0.5">
            <span className="text-[11px] font-semibold text-slate-800">{assignment.shiftTemplate?.name || 'Zmiana'}</span>
            <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-500">
              {assignment.shiftTemplate?.startTime && assignment.shiftTemplate?.endTime && (
                <span className="rounded-full bg-slate-100 px-2 py-[2px] font-semibold text-slate-700">
                  {assignment.shiftTemplate.startTime} - {assignment.shiftTemplate.endTime}
                </span>
              )}
              {assignment.breaks && assignment.breaks.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-[2px] font-semibold text-blue-700">
                  {assignment.breaks.length} przerw
                </span>
              )}
              {assignment.overtimeHours > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-[2px] font-semibold text-orange-700">
                  +{assignment.overtimeHours}h
                </span>
              )}
            </div>
            <div className="mt-1 h-1.5 w-12 rounded-full" style={{ backgroundColor: color }} />
          </div>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition group-hover:border-theme-primary group-hover:text-theme-primary">
            +
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="app-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Kalendarz grafików (Enhanced)</h1>
            <p className="text-sm text-slate-600">Planowanie z przerwami, nadgodzinami i operacjami masowymi</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleMonthChange(-1)} className="btn-secondary">◀</button>
            <div className="min-w-[160px] text-center text-sm font-semibold text-slate-800">
              {monthLabel(selectedMonth)}
            </div>
            <button onClick={() => handleMonthChange(1)} className="btn-secondary">▶</button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedSchedule?._id || ''}
              onChange={(e) => {
                const next = schedules?.find((s) => s._id === e.target.value);
                setSelectedSchedule(next || null);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Wybierz grafik</option>
              {schedules?.map((schedule) => (
                <option key={schedule._id} value={schedule._id}>
                  {schedule.name || `Grafik ${schedule.month}`}
                </option>
              ))}
            </select>
            <button
              onClick={() => createSchedule.mutate()}
              className="rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              Nowy grafik
            </button>
            <button
              onClick={() => setBulkOpsOpen(true)}
              disabled={!selectedSchedule}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 disabled:opacity-60"
            >
              Operacje masowe
            </button>
          </div>
        </div>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: null, message: null })} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="app-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Filtry</h3>
              <StatusBadge label="Enhanced" color="#14b8a6" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Szukaj pracownika</label>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="np. Anna So"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Status</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Wszystko' },
                  { key: 'planned', label: 'Zaplanowane' },
                  { key: 'empty', label: 'Brak zmian' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                      statusFilter === item.key
                        ? 'border-theme-primary bg-theme-primary/10 text-theme-primary'
                        : 'border-slate-200 text-slate-700 hover:border-theme-primary/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {scheduleDetail?.summary && (
            <div className="app-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Podsumowanie</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  <div className="text-lg font-bold">{scheduleDetail.summary.totalAssignments}</div>
                  <div className="text-[11px] uppercase tracking-wide">Zmian</div>
                </div>
                <div className="rounded-lg bg-sky-50 p-3 text-sky-700">
                  <div className="text-lg font-bold">{scheduleDetail.summary.totalEmployees}</div>
                  <div className="text-[11px] uppercase tracking-wide">Pracowników</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
                  <div className="text-lg font-bold">{scheduleDetail.summary.totalHours}</div>
                  <div className="text-[11px] uppercase tracking-wide">Godzin</div>
                </div>
                <div className="rounded-lg bg-rose-50 p-3 text-rose-700">
                  <div className="text-lg font-bold">{scheduleDetail.summary.totalViolations}</div>
                  <div className="text-[11px] uppercase tracking-wide">Naruszeń</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-9 app-card p-0 overflow-hidden">
          <div className="w-full overflow-x-auto pb-2">
            <div
              className="grid"
              style={{ gridTemplateColumns: `240px repeat(${daysInMonth.length}, minmax(52px, 1fr))` }}
            >
              <div className="sticky left-0 z-10 bg-white px-4 py-3 border-b border-r border-slate-200">
                <p className="text-xs font-semibold text-slate-700">Pracownicy</p>
                <p className="text-[11px] text-slate-500">Kliknij aby przypisać zmiany</p>
              </div>
              {daysInMonth.map((day) => (
                <div
                  key={day.key}
                  className={`border-b border-slate-200 px-3 py-2 text-center text-[11px] font-semibold ${
                    day.weekday.toLowerCase().includes('sob') || day.weekday.toLowerCase().includes('nie')
                      ? 'bg-slate-50 text-slate-500'
                      : 'text-slate-600'
                  }`}
                >
                  <div>{day.day}</div>
                  <div className="text-[10px] text-slate-400">{day.weekday}</div>
                </div>
              ))}

              {filteredEmployees.map((employee) => (
                <React.Fragment key={employee._id}>
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-slate-200 bg-white px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                      {employee.firstName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{employee.firstName} {employee.lastName}</p>
                      <p className="text-[11px] text-slate-500">{employee.position || 'Pracownik'}</p>
                    </div>
                  </div>
                  {daysInMonth.map((day) => (
                    <div
                      key={`${employee._id}-${day.key}`}
                      className="border-b border-slate-200 px-2 py-2"
                    >
                      {renderCell(employee, day)}
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {!scheduleLoading && filteredEmployees.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-slate-500">
                  Brak pracowników spełniających kryteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EnhancedAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        employees={employeesData || []}
        shiftTemplates={shiftTemplatesData || []}
        formState={modalState}
        setFormState={setModalState}
        loading={createAssignment.isLoading || updateAssignment.isLoading || deleteAssignment.isLoading}
      />

      {bulkOpsOpen && selectedSchedule && (
        <BulkScheduleOperations
          scheduleId={selectedSchedule._id}
          onClose={() => setBulkOpsOpen(false)}
        />
      )}
    </div>
  );
};

export default ScheduleBuilderV2Enhanced;
