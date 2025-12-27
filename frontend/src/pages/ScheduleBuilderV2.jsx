import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

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

const quickShiftTemplates = [
  { key: 'shift-1', label: 'I zmiana', hours: '05:45 - 15:00', templateName: 'I zmiana', color: '#0ea5e9' },
  { key: 'shift-2', label: 'II zmiana', hours: '14:45 - 23:00', templateName: 'II zmiana', color: '#a855f7' },
  { key: 'delivery', label: 'D - Dostawa', hours: 'Godzina do ustalenia', templateName: 'Dostawa', color: '#f59e0b' },
];

const noteTypeOptions = [
  { value: '', label: 'Brak' },
  { value: 'Informacja', label: 'Informacja' },
  { value: 'Pilne', label: 'Pilne' },
  { value: 'Dostawa', label: 'Dostawa' },
];

const parseNotes = (notes) => {
  if (!notes) return { noteType: '', noteText: '' };
  const matched = noteTypeOptions.find((opt) => opt.value && notes.startsWith(`${opt.value}:`));
  if (matched) {
    return { noteType: matched.value, noteText: notes.replace(`${matched.value}:`, '').trim() };
  }
  return { noteType: '', noteText: notes };
};

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Rodzaj notatki</label>
              <select
                value={formState.noteType || ''}
                onChange={handleChange('noteType')}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
              >
                {noteTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-700">Szybkie szablony</span>
              <div className="flex flex-wrap gap-2">
                {quickShiftTemplates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => {
                      const match = shiftTemplates.find((t) =>
                        t.name?.toLowerCase().includes(template.templateName.toLowerCase())
                      );
                      setFormState((prev) => ({
                        ...prev,
                        shiftTemplateId: match?._id || prev.shiftTemplateId,
                        notes: template.hours,
                        noteType: template.label.includes('Dostawa') ? 'Dostawa' : 'Informacja',
                      }));
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-theme-primary hover:text-theme-primary"
                    style={{ boxShadow: `0 6px 18px ${template.color}22` }}
                  >
                    {template.label}
                    <span className="ml-1 text-[10px] text-slate-500">{template.hours}</span>
                  </button>
                ))}
              </div>
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
  const [modalState, setModalState] = useState({ employeeId: '', date: '', shiftTemplateId: '', notes: '', noteType: '' });
  const [dragState, setDragState] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [isPointerSelecting, setIsPointerSelecting] = useState(false);
  const [copyBuffer, setCopyBuffer] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

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

  useEffect(() => {
    if (selectedSchedule?.month) {
      setSelectedMonth(selectedSchedule.month);
    }
  }, [selectedSchedule]);

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

  const resetSelection = () => {
    setSelectionRect(null);
    setIsPointerSelecting(false);
  };

  const openModal = (employeeId, dateKey) => {
    if (selectionMode) return;
    setModalState((prev) => {
      const key = `${employeeId}-${dateKey}`;
      const existing = assignmentsByKey[key];
      const parsedNotes = parseNotes(existing?.notes);
      return {
        ...prev,
        employeeId,
        date: dateKey,
        shiftTemplateId: existing?.shiftTemplate?._id || '',
        notes: parsedNotes.noteText,
        noteType: parsedNotes.noteType,
        assignmentId: existing?._id,
        type: existing?.type || 'shift',
        startTime: existing?.startTime || existing?.shiftTemplate?.startTime || '',
        endTime: existing?.endTime || existing?.shiftTemplate?.endTime || '',
      };
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedSchedule) return;
    const notes = modalState.noteType
      ? `${modalState.noteType}: ${modalState.notes || ''}`.trim()
      : modalState.notes;

    const selectedTemplate = shiftTemplatesData?.find((tpl) => tpl._id === modalState.shiftTemplateId);
    const payloadType = modalState.type || 'shift';
    const startTime = modalState.startTime || selectedTemplate?.startTime;
    const endTime = modalState.endTime || selectedTemplate?.endTime;

    if (!startTime || !endTime) {
      setAlert({ type: 'error', message: 'Szablon zmiany musi zawierać godziny rozpoczęcia i zakończenia.' });
      return;
    }

    const payload = {
      scheduleId: selectedSchedule._id,
      employeeId: modalState.employeeId,
      date: modalState.date,
      shiftTemplateId: modalState.shiftTemplateId,
      notes,
      type: payloadType,
      startTime,
      endTime,
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

  useEffect(() => {
    resetSelection();
  }, [selectedSchedule?._id, selectedMonth, assignments.length]);

  const handleMonthChange = (direction) => {
    const date = new Date(`${selectedMonth}-01T00:00:00`);
    date.setMonth(date.getMonth() + direction);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleDragStart = (assignment, employeeId, dateKey) => {
    if (selectionMode) return;
    setDragState({ assignment, sourceEmployeeId: employeeId, sourceDate: dateKey });
  };

  const handleDragEnd = () => setDragState(null);

  const selectionContainsKey = (employeeId, dateKey) => {
    if (!selectionRect) return false;
    return selectionRect.keys.has(`${employeeId}-${dateKey}`);
  };

  const pointerIndices = useMemo(() => {
    if (!filteredEmployees.length) return { employees: {}, days: {} };
    const employeeMap = {};
    filteredEmployees.forEach((emp, idx) => {
      employeeMap[emp._id] = idx;
    });
    const dayMap = {};
    daysInMonth.forEach((day, idx) => {
      dayMap[day.key] = idx;
    });
    return { employees: employeeMap, days: dayMap };
  }, [filteredEmployees, daysInMonth]);

  const clampRect = (start, end) => {
    if (!start || !end) return null;
    const [startEmp, startDay] = start;
    const [endEmp, endDay] = end;
    if (startEmp == null || startDay == null || endEmp == null || endDay == null) return null;

    const minEmp = Math.min(startEmp, endEmp);
    const maxEmp = Math.max(startEmp, endEmp);
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);

    const keys = new Set();
    for (let empIndex = minEmp; empIndex <= maxEmp; empIndex += 1) {
      const employeeId = filteredEmployees[empIndex]?._id;
      if (!employeeId) continue;
      for (let dayIndex = minDay; dayIndex <= maxDay; dayIndex += 1) {
        const dayKey = daysInMonth[dayIndex]?.key;
        if (!dayKey) continue;
        keys.add(`${employeeId}-${dayKey}`);
      }
    }

    return {
      minEmp,
      maxEmp,
      minDay,
      maxDay,
      keys,
    };
  };

  const handlePointerDown = (employeeId, dayKey) => {
    if (!selectionMode) return;
    const empIdx = pointerIndices.employees[employeeId];
    const dayIdx = pointerIndices.days[dayKey];
    if (empIdx == null || dayIdx == null) return;
    setIsPointerSelecting(true);
    const rect = clampRect([empIdx, dayIdx], [empIdx, dayIdx]);
    setSelectionRect(rect);
  };

  const handlePointerEnter = (employeeId, dayKey) => {
    if (!selectionMode || !isPointerSelecting) return;
    const empIdx = pointerIndices.employees[employeeId];
    const dayIdx = pointerIndices.days[dayKey];
    if (empIdx == null || dayIdx == null) return;
    setSelectionRect((prev) => {
      if (!prev) return clampRect([empIdx, dayIdx], [empIdx, dayIdx]);
      return clampRect([prev.minEmp, prev.minDay], [empIdx, dayIdx]);
    });
  };

  const handlePointerUp = () => {
    if (!selectionMode) return;
    setIsPointerSelecting(false);
  };

  const runBulkAction = async (actions, successMessage) => {
    if (!actions.length) {
      setAlert({ type: 'info', message: 'Brak zmian do wykonania.' });
      return;
    }
    try {
      setBulkLoading(true);
      await Promise.all(actions);
      setAlert({ type: 'success', message: successMessage });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Operacja nie powiodła się.' });
    } finally {
      setBulkLoading(false);
    }
  };

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
    const isSelected = selectionContainsKey(employee._id, day.key);
    const color = assignment?.shiftTemplate?.color || '#22c55e';
    const parsedNotes = parseNotes(assignment?.notes);
    const fallbackNote = parsedNotes.noteText || assignment?.type || '';
    const noteAccent = parsedNotes.noteType === 'Pilne'
      ? 'bg-rose-100 text-rose-700'
      : parsedNotes.noteType === 'Dostawa'
      ? 'bg-amber-100 text-amber-700'
      : parsedNotes.noteType === 'Informacja'
      ? 'bg-sky-100 text-sky-700'
      : 'bg-slate-100 text-slate-600';
    const showPlaceholder = !assignment && !selectionMode;
    const selectionRing = isSelected ? 'ring-2 ring-theme-primary/40 border-theme-primary/60 bg-theme-primary/5' : '';

    const commonHandlers = selectionMode
      ? {
          onMouseDown: () => handlePointerDown(employee._id, day.key),
          onMouseEnter: () => handlePointerEnter(employee._id, day.key),
          onMouseUp: handlePointerUp,
        }
      : {
          onClick: () => openModal(employee._id, day.key),
        };

    return (
      <button
        key={day.key}
        {...commonHandlers}
        draggable={!selectionMode && !!assignment}
        onDragStart={() => assignment && handleDragStart(assignment, employee._id, day.key)}
        onDragEnd={handleDragEnd}
        className={`group relative flex h-[4.25rem] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs transition-all duration-150 hover:-translate-y-[1px] hover:border-theme-primary hover:shadow-sm ${
          assignment && !selectionMode ? 'cursor-grab active:cursor-grabbing' : ''
        } ${selectionRing}`}
        onDoubleClick={() => !selectionMode && openModal(employee._id, day.key)}
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
              {parsedNotes.noteText && (
                <span className={`rounded-full px-2 py-[2px] font-semibold ${noteAccent}`}>
                  {parsedNotes.noteText}
                </span>
              )}
              {!parsedNotes.noteText && fallbackNote && (
                <span className="rounded-full bg-slate-100 px-2 py-[2px] font-semibold text-slate-600">
                  {fallbackNote}
                </span>
              )}
            </div>
            <div className="mt-1 h-1.5 w-12 rounded-full" style={{ backgroundColor: color }} />
          </div>
        ) : (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition group-hover:border-theme-primary group-hover:text-theme-primary ${
              showPlaceholder ? '' : 'hidden'
            }`}
          >
            +
          </span>
        )}
        {selectionMode && !assignment && (
          <span className="absolute inset-2 rounded-lg border border-dashed border-theme-primary/60" />
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
                  {daysInMonth.map((day) => {
                    const key = `${employee._id}-${day.key}`;
                    const hasAssignment = !!assignmentsByKey[key];
                    const isDropTarget =
                      !!dragState && !(dragState.sourceEmployeeId === employee._id && dragState.sourceDate === day.key);
                    const isSelected = selectionContainsKey(employee._id, day.key);
                    return (
                      <div
                        key={`${employee._id}-${day.key}`}
                        className={`border-b border-slate-200 px-2 py-2 transition ${
                          isDropTarget && dragState ? 'bg-sky-50/70 ring-1 ring-sky-100' : ''
                        } ${hasAssignment ? 'hover:bg-slate-50/70' : ''} ${isSelected ? 'bg-theme-primary/5' : ''}`}
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
