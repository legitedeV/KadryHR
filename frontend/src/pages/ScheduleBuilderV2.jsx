import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

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
      key: date.toISOString().split('T')[0],
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

const AssignmentModal = ({ open, onClose, onSave, onDelete, employees, shiftTemplates, formState, setFormState, loading }) => {
  if (!open) return null;

  const handleChange = (key) => (e) => {
    setFormState((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">{formState.date}</p>
            <h3 className="text-lg font-semibold text-slate-900">Przypisz zmianę</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Pracownik</label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Szablon zmiany</label>
              <select
                value={formState.shiftTemplateId}
                onChange={handleChange('shiftTemplateId')}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
              >
                <option value="">Wybierz szablon</option>
                {shiftTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
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
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
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

const ScheduleBuilderV2 = () => {
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
  const [modalState, setModalState] = useState({ employeeId: '', date: '', shiftTemplateId: '', notes: '' });
  const [dragState, setDragState] = useState(null);

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
      return data.templates || [];
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
      const dateStr = new Date(assignment.date).toISOString().split('T')[0];
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
      };
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedSchedule) return;
    const payload = {
      scheduleId: selectedSchedule._id,
      employeeId: modalState.employeeId,
      date: modalState.date,
      shiftTemplateId: modalState.shiftTemplateId,
      notes: modalState.notes,
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

  const handleDragStart = (assignment, employeeId, dateKey) => {
    setDragState({ assignment, sourceEmployeeId: employeeId, sourceDate: dateKey });
  };

  const handleDragEnd = () => setDragState(null);

  const handleDropOnCell = async (employeeId, dateKey) => {
    if (!dragState || !selectedSchedule) return;
    const targetKey = `${employeeId}-${dateKey}`;
    const sourceKey = `${dragState.sourceEmployeeId}-${dragState.sourceDate}`;
    if (targetKey === sourceKey) {
      setDragState(null);
      return;
    }

    const targetAssignment = assignmentsByKey[targetKey];
    const draggedAssignment = dragState.assignment;

    try {
      if (targetAssignment) {
        await Promise.all([
          updateAssignment.mutateAsync({
            id: draggedAssignment._id,
            scheduleId: selectedSchedule._id,
            employeeId,
            date: dateKey,
            shiftTemplateId: draggedAssignment.shiftTemplate?._id,
            notes: draggedAssignment.notes,
          }),
          updateAssignment.mutateAsync({
            id: targetAssignment._id,
            scheduleId: selectedSchedule._id,
            employeeId: dragState.sourceEmployeeId,
            date: dragState.sourceDate,
            shiftTemplateId: targetAssignment.shiftTemplate?._id,
            notes: targetAssignment.notes,
          }),
        ]);
        setAlert({ type: 'success', message: 'Zamieniono zmiany miejscami.' });
      } else {
        await updateAssignment.mutateAsync({
          id: draggedAssignment._id,
          scheduleId: selectedSchedule._id,
          employeeId,
          date: dateKey,
          shiftTemplateId: draggedAssignment.shiftTemplate?._id,
          notes: draggedAssignment.notes,
        });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się przenieść zmiany.' });
    } finally {
      setDragState(null);
    }
  };

  const renderCell = (employee, day) => {
    const key = `${employee._id}-${day.key}`;
    const assignment = assignmentsByKey[key];
    const isDragSource = dragState?.assignment?._id === assignment?._id;
    const color = assignment?.shiftTemplate?.color || '#22c55e';
    return (
      <button
        key={day.key}
        onClick={() => openModal(employee._id, day.key)}
        draggable={!!assignment}
        onDragStart={() => assignment && handleDragStart(assignment, employee._id, day.key)}
        onDragEnd={handleDragEnd}
        className={`group relative flex h-14 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs transition hover:border-theme-primary ${
          assignment ? 'cursor-grab active:cursor-grabbing' : ''
        } ${isDragSource ? 'ring-2 ring-theme-primary/40 border-theme-primary/60' : ''}`}
      >
        {assignment ? (
          <div className="flex flex-col items-center text-center leading-tight">
            <span className="text-[11px] font-semibold text-slate-800">{assignment.shiftTemplate?.name || 'Zmiana'}</span>
            <span className="text-[10px] text-slate-500">{assignment.notes || assignment.type || 'Zaplanowano'}</span>
            <div className="mt-1 h-1.5 w-10 rounded-full" style={{ backgroundColor: color }} />
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Dodaj</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="app-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Kalendarz grafików</h1>
            <p className="text-sm text-slate-600">Planowanie miesięczne w widoku siatki</p>
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
              <StatusBadge label="Beta" color="#14b8a6" />
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
            <div className="pt-2 text-xs text-slate-500">
              Kliknij w komórkę, aby dodać lub edytować zmianę. Zmiany są zapisywane w czasie rzeczywistym.
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
          <div className="w-full">
            <div
              className="grid w-full"
              style={{ gridTemplateColumns: `200px repeat(${daysInMonth.length}, minmax(28px, 1fr))` }}
            >
              <div className="sticky left-0 z-10 bg-white px-3 py-2 border-b border-r border-slate-200">
                <p className="text-xs font-semibold text-slate-700">Pracownicy</p>
                <p className="text-[11px] text-slate-500">Kliknij aby przypisać zmiany</p>
              </div>
              {daysInMonth.map((day) => (
                <div key={day.key} className="border-b border-slate-200 px-2 py-2 text-center text-[11px] font-semibold text-slate-600">
                  <div>{day.day}</div>
                  <div className="text-[10px] text-slate-400">{day.weekday}</div>
                </div>
              ))}

              {filteredEmployees.map((employee) => (
                <React.Fragment key={employee._id}>
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-slate-200 bg-white px-3 py-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                      {employee.firstName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{employee.firstName} {employee.lastName}</p>
                      <p className="text-[11px] text-slate-500">{employee.position || 'Pracownik'}</p>
                    </div>
                  </div>
                  {daysInMonth.map((day) => {
                    const key = `${employee._id}-${day.key}`;
                    const hasAssignment = !!assignmentsByKey[key];
                    const isDropTarget =
                      !!dragState && !(dragState.sourceEmployeeId === employee._id && dragState.sourceDate === day.key);
                    return (
                      <div
                        key={`${employee._id}-${day.key}`}
                        className={`border-b border-slate-200 px-1 py-1 transition ${
                          isDropTarget && dragState ? 'bg-sky-50/60 ring-1 ring-sky-100' : ''
                        } ${hasAssignment ? 'hover:bg-slate-50' : ''}`}
                        onDragOver={(e) => {
                          if (dragState) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnCell(employee._id, day.key);
                        }}
                      >
                        {renderCell(employee, day)}
                      </div>
                    );
                  })}
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

      <AssignmentModal
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
    </div>
  );
};

export default ScheduleBuilderV2;
