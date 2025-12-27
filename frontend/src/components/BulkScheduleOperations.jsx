import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from './Alert';

const BulkScheduleOperations = ({ scheduleId, onClose }) => {
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState({ type: null, message: null });
  const [activeTab, setActiveTab] = useState('bulk-create');
  
  // Bulk Create State
  const [bulkCreateForm, setBulkCreateForm] = useState({
    assignments: [],
    employeeId: '',
    shiftTemplateId: '',
    startDate: '',
    endDate: '',
    daysOfWeek: []
  });

  // Bulk Update State
  const [bulkUpdateForm, setBulkUpdateForm] = useState({
    assignmentIds: '',
    updates: {
      shiftTemplateId: '',
      notes: ''
    }
  });

  // Copy Shift State
  const [copyShiftForm, setCopyShiftForm] = useState({
    assignmentId: '',
    targetDate: ''
  });

  // Duplicate Week State
  const [duplicateWeekForm, setDuplicateWeekForm] = useState({
    sourceWeekStart: '',
    targetWeekStart: ''
  });

  // Copy Employee Schedule State
  const [copyEmployeeForm, setCopyEmployeeForm] = useState({
    sourceEmployeeId: '',
    targetEmployeeId: '',
    startDate: '',
    endDate: ''
  });

  // Bulk Reassign State
  const [bulkReassignForm, setBulkReassignForm] = useState({
    assignmentIds: '',
    newEmployeeId: ''
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

  const bulkCreate = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/schedules/${scheduleId}/bulk/create`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: `Utworzono ${data.created} zmian pomyślnie.` });
      setBulkCreateForm({
        assignments: [],
        employeeId: '',
        shiftTemplateId: '',
        startDate: '',
        endDate: '',
        daysOfWeek: []
      });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się utworzyć zmian.' }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put(`/schedules/${scheduleId}/bulk/update`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: `Zaktualizowano ${data.updated} zmian pomyślnie.` });
      setBulkUpdateForm({
        assignmentIds: '',
        updates: {
          shiftTemplateId: '',
          notes: ''
        }
      });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się zaktualizować zmian.' }),
  });

  const bulkDelete = useMutation({
    mutationFn: async (assignmentIds) => {
      const { data } = await api.delete(`/schedules/${scheduleId}/bulk/delete`, {
        data: { assignmentIds }
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: `Usunięto ${data.deleted} zmian pomyślnie.` });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się usunąć zmian.' }),
  });

  const copyShift = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/schedules/${scheduleId}/bulk/copy-shift`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: 'Zmiana skopiowana pomyślnie.' });
      setCopyShiftForm({
        assignmentId: '',
        targetDate: ''
      });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się skopiować zmiany.' }),
  });

  const duplicateWeek = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/schedules/${scheduleId}/bulk/duplicate-week`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: `Skopiowano ${data.created} zmian z tygodnia.` });
      setDuplicateWeekForm({
        sourceWeekStart: '',
        targetWeekStart: ''
      });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się skopiować tygodnia.' }),
  });

  const copyEmployeeSchedule = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/schedules/${scheduleId}/bulk/copy-employee`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: `Skopiowano ${data.created} zmian dla pracownika.` });
      setCopyEmployeeForm({
        sourceEmployeeId: '',
        targetEmployeeId: '',
        startDate: '',
        endDate: ''
      });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się skopiować grafiku pracownika.' }),
  });

  const bulkReassign = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/schedules/${scheduleId}/bulk/reassign`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedule-v2-detail', scheduleId]);
      setAlert({ type: 'success', message: `Przepisano ${data.updated} zmian pomyślnie.` });
      setBulkReassignForm({
        assignmentIds: '',
        newEmployeeId: ''
      });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się przepisać zmian.' }),
  });

  const handleBulkCreate = () => {
    if (!bulkCreateForm.employeeId || !bulkCreateForm.shiftTemplateId || !bulkCreateForm.startDate || !bulkCreateForm.endDate) {
      setAlert({ type: 'error', message: 'Wszystkie pola są wymagane.' });
      return;
    }

    if (bulkCreateForm.daysOfWeek.length === 0) {
      setAlert({ type: 'error', message: 'Wybierz co najmniej jeden dzień tygodnia.' });
      return;
    }

    const assignments = [];
    const start = new Date(bulkCreateForm.startDate);
    const end = new Date(bulkCreateForm.endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (bulkCreateForm.daysOfWeek.includes(dayOfWeek)) {
        assignments.push({
          employeeId: bulkCreateForm.employeeId,
          date: date.toISOString().split('T')[0],
          shiftTemplateId: bulkCreateForm.shiftTemplateId
        });
      }
    }

    bulkCreate.mutate({ assignments });
  };

  const handleBulkUpdate = () => {
    const assignmentIds = bulkUpdateForm.assignmentIds.split(',').map(id => id.trim()).filter(Boolean);
    if (assignmentIds.length === 0) {
      setAlert({ type: 'error', message: 'Podaj ID zmian do aktualizacji.' });
      return;
    }

    const updates = {};
    if (bulkUpdateForm.updates.shiftTemplateId) updates.shiftTemplateId = bulkUpdateForm.updates.shiftTemplateId;
    if (bulkUpdateForm.updates.notes) updates.notes = bulkUpdateForm.updates.notes;

    if (Object.keys(updates).length === 0) {
      setAlert({ type: 'error', message: 'Podaj co najmniej jedno pole do aktualizacji.' });
      return;
    }

    bulkUpdate.mutate({ assignmentIds, updates });
  };

  const handleBulkDelete = () => {
    const ids = prompt('Podaj ID zmian do usunięcia (oddzielone przecinkami):');
    if (!ids) return;

    const assignmentIds = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (assignmentIds.length === 0) {
      setAlert({ type: 'error', message: 'Podaj prawidłowe ID zmian.' });
      return;
    }

    if (window.confirm(`Czy na pewno chcesz usunąć ${assignmentIds.length} zmian?`)) {
      bulkDelete.mutate(assignmentIds);
    }
  };

  const handleCopyShift = () => {
    if (!copyShiftForm.assignmentId || !copyShiftForm.targetDate) {
      setAlert({ type: 'error', message: 'Wszystkie pola są wymagane.' });
      return;
    }

    copyShift.mutate(copyShiftForm);
  };

  const handleDuplicateWeek = () => {
    if (!duplicateWeekForm.sourceWeekStart || !duplicateWeekForm.targetWeekStart) {
      setAlert({ type: 'error', message: 'Wszystkie pola są wymagane.' });
      return;
    }

    duplicateWeek.mutate(duplicateWeekForm);
  };

  const handleCopyEmployeeSchedule = () => {
    if (!copyEmployeeForm.sourceEmployeeId || !copyEmployeeForm.targetEmployeeId || !copyEmployeeForm.startDate || !copyEmployeeForm.endDate) {
      setAlert({ type: 'error', message: 'Wszystkie pola są wymagane.' });
      return;
    }

    copyEmployeeSchedule.mutate(copyEmployeeForm);
  };

  const handleBulkReassign = () => {
    const assignmentIds = bulkReassignForm.assignmentIds.split(',').map(id => id.trim()).filter(Boolean);
    if (assignmentIds.length === 0 || !bulkReassignForm.newEmployeeId) {
      setAlert({ type: 'error', message: 'Wszystkie pola są wymagane.' });
      return;
    }

    bulkReassign.mutate({ assignmentIds, newEmployeeId: bulkReassignForm.newEmployeeId });
  };

  const toggleDayOfWeek = (day) => {
    setBulkCreateForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const daysOfWeek = [
    { value: 1, label: 'Pon' },
    { value: 2, label: 'Wt' },
    { value: 3, label: 'Śr' },
    { value: 4, label: 'Czw' },
    { value: 5, label: 'Pt' },
    { value: 6, label: 'Sob' },
    { value: 0, label: 'Nie' }
  ];

  const employees = employeesData || [];
  const shiftTemplates = shiftTemplatesData || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Operacje masowe</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: null, message: null })} />
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-2">
          {[
            { key: 'bulk-create', label: 'Masowe tworzenie' },
            { key: 'bulk-update', label: 'Masowa aktualizacja' },
            { key: 'copy-shift', label: 'Kopiuj zmianę' },
            { key: 'duplicate-week', label: 'Duplikuj tydzień' },
            { key: 'copy-employee', label: 'Kopiuj grafik' },
            { key: 'bulk-reassign', label: 'Przepisz zmiany' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === tab.key
                  ? 'bg-theme-gradient text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bulk Create */}
        {activeTab === 'bulk-create' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Utwórz wiele zmian naraz</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Pracownik *</label>
                <select
                  value={bulkCreateForm.employeeId}
                  onChange={(e) => setBulkCreateForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Wybierz pracownika</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Szablon zmiany *</label>
                <select
                  value={bulkCreateForm.shiftTemplateId}
                  onChange={(e) => setBulkCreateForm(prev => ({ ...prev, shiftTemplateId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Wybierz szablon</option>
                  {shiftTemplates.map(template => (
                    <option key={template._id} value={template._id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Data początkowa *</label>
                <input
                  type="date"
                  value={bulkCreateForm.startDate}
                  onChange={(e) => setBulkCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Data końcowa *</label>
                <input
                  type="date"
                  value={bulkCreateForm.endDate}
                  onChange={(e) => setBulkCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Dni tygodnia *</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      bulkCreateForm.daysOfWeek.includes(day.value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleBulkCreate}
              disabled={bulkCreate.isLoading}
              className="w-full rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Utwórz zmiany
            </button>
          </div>
        )}

        {/* Bulk Update */}
        {activeTab === 'bulk-update' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Zaktualizuj wiele zmian naraz</h4>
            <div>
              <label className="text-xs font-semibold text-slate-700">ID zmian (oddzielone przecinkami) *</label>
              <input
                type="text"
                value={bulkUpdateForm.assignmentIds}
                onChange={(e) => setBulkUpdateForm(prev => ({ ...prev, assignmentIds: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                placeholder="np. 123abc, 456def, 789ghi"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Nowy szablon zmiany</label>
                <select
                  value={bulkUpdateForm.updates.shiftTemplateId}
                  onChange={(e) => setBulkUpdateForm(prev => ({
                    ...prev,
                    updates: { ...prev.updates, shiftTemplateId: e.target.value }
                  }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Bez zmian</option>
                  {shiftTemplates.map(template => (
                    <option key={template._id} value={template._id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Nowa notatka</label>
                <input
                  type="text"
                  value={bulkUpdateForm.updates.notes}
                  onChange={(e) => setBulkUpdateForm(prev => ({
                    ...prev,
                    updates: { ...prev.updates, notes: e.target.value }
                  }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                  placeholder="Opcjonalna notatka"
                />
              </div>
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkUpdate.isLoading}
              className="w-full rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Zaktualizuj zmiany
            </button>
          </div>
        )}

        {/* Copy Shift */}
        {activeTab === 'copy-shift' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Skopiuj pojedynczą zmianę</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">ID zmiany do skopiowania *</label>
                <input
                  type="text"
                  value={copyShiftForm.assignmentId}
                  onChange={(e) => setCopyShiftForm(prev => ({ ...prev, assignmentId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                  placeholder="np. 123abc"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Data docelowa *</label>
                <input
                  type="date"
                  value={copyShiftForm.targetDate}
                  onChange={(e) => setCopyShiftForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCopyShift}
              disabled={copyShift.isLoading}
              className="w-full rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Skopiuj zmianę
            </button>
          </div>
        )}

        {/* Duplicate Week */}
        {activeTab === 'duplicate-week' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Duplikuj cały tydzień</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Początek tygodnia źródłowego (poniedziałek) *</label>
                <input
                  type="date"
                  value={duplicateWeekForm.sourceWeekStart}
                  onChange={(e) => setDuplicateWeekForm(prev => ({ ...prev, sourceWeekStart: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Początek tygodnia docelowego (poniedziałek) *</label>
                <input
                  type="date"
                  value={duplicateWeekForm.targetWeekStart}
                  onChange={(e) => setDuplicateWeekForm(prev => ({ ...prev, targetWeekStart: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleDuplicateWeek}
              disabled={duplicateWeek.isLoading}
              className="w-full rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Duplikuj tydzień
            </button>
          </div>
        )}

        {/* Copy Employee Schedule */}
        {activeTab === 'copy-employee' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Skopiuj grafik pracownika</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Pracownik źródłowy *</label>
                <select
                  value={copyEmployeeForm.sourceEmployeeId}
                  onChange={(e) => setCopyEmployeeForm(prev => ({ ...prev, sourceEmployeeId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Wybierz pracownika</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Pracownik docelowy *</label>
                <select
                  value={copyEmployeeForm.targetEmployeeId}
                  onChange={(e) => setCopyEmployeeForm(prev => ({ ...prev, targetEmployeeId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                >
                  <option value="">Wybierz pracownika</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Data początkowa *</label>
                <input
                  type="date"
                  value={copyEmployeeForm.startDate}
                  onChange={(e) => setCopyEmployeeForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Data końcowa *</label>
                <input
                  type="date"
                  value={copyEmployeeForm.endDate}
                  onChange={(e) => setCopyEmployeeForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCopyEmployeeSchedule}
              disabled={copyEmployeeSchedule.isLoading}
              className="w-full rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Skopiuj grafik
            </button>
          </div>
        )}

        {/* Bulk Reassign */}
        {activeTab === 'bulk-reassign' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Przepisz zmiany na innego pracownika</h4>
            <div>
              <label className="text-xs font-semibold text-slate-700">ID zmian (oddzielone przecinkami) *</label>
              <input
                type="text"
                value={bulkReassignForm.assignmentIds}
                onChange={(e) => setBulkReassignForm(prev => ({ ...prev, assignmentIds: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                placeholder="np. 123abc, 456def, 789ghi"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Nowy pracownik *</label>
              <select
                value={bulkReassignForm.newEmployeeId}
                onChange={(e) => setBulkReassignForm(prev => ({ ...prev, newEmployeeId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
              >
                <option value="">Wybierz pracownika</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleBulkReassign}
              disabled={bulkReassign.isLoading}
              className="w-full rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
            >
              Przepisz zmiany
            </button>
          </div>
        )}

        {/* Bulk Delete Button */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={handleBulkDelete}
            disabled={bulkDelete.isLoading}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
          >
            Usuń wiele zmian
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkScheduleOperations;
