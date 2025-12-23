import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const ScheduleBuilderV2 = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Parse selected month
  const [year, month] = selectedMonth.split('-').map(Number);

  // Fetch schedules for selected month
  const { data: schedulesData } = useQuery({
    queryKey: ['schedules-v2', year, month],
    queryFn: async () => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const { data } = await api.get('/schedules/v2', {
        params: { month: monthStr, year }
      });
      return data.schedules || [];
    }
  });

  // Fetch schedule details with assignments
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule-v2-detail', selectedSchedule?._id],
    queryFn: async () => {
      if (!selectedSchedule) return null;
      const { data } = await api.get(`/schedules/v2/${selectedSchedule._id}`);
      return data;
    },
    enabled: !!selectedSchedule
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      return data.employees || [];
    }
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/schedules/v2', payload);
      return data.schedule;
    },
    onSuccess: (schedule) => {
      queryClient.invalidateQueries(['schedules-v2']);
      setSelectedSchedule(schedule);
      setSuccess('Grafik utworzony pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się utworzyć grafiku');
    }
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async ({ scheduleId, ...payload }) => {
      const { data } = await api.post(`/schedules/v2/${scheduleId}/assignments`, payload);
      return data.assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-v2-detail']);
      setShowModal(false);
      setSuccess('Przypisanie utworzone pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się utworzyć przypisania');
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/schedules/v2/assignments/${id}`, payload);
      return data.assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-v2-detail']);
      setShowModal(false);
      setSuccess('Przypisanie zaktualizowane pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować przypisania');
    }
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/schedules/v2/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-v2-detail']);
      setShowModal(false);
      setSuccess('Przypisanie usunięte pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się usunąć przypisania');
    }
  });

  // Get days in month
  const daysInMonth = useMemo(() => {
    const days = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [year, month]);

  // Get assignments by employee and date
  const assignmentsByEmployeeAndDate = useMemo(() => {
    if (!scheduleData?.assignments) return {};
    
    const map = {};
    scheduleData.assignments.forEach(assignment => {
      const employeeId = assignment.employee._id;
      const dateStr = new Date(assignment.date).toISOString().split('T')[0];
      const key = `${employeeId}-${dateStr}`;
      map[key] = assignment;
    });
    return map;
  }, [scheduleData]);

  const handleCreateSchedule = () => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const name = `Grafik ${monthStr}`;
    createScheduleMutation.mutate({ name, month: monthStr, year });
  };

  const handleCellClick = (employee, date) => {
    if (!selectedSchedule) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const key = `${employee._id}-${dateStr}`;
    const existing = assignmentsByEmployeeAndDate[key];
    
    setModalData({
      employee,
      date: dateStr,
      existing
    });
    setShowModal(true);
  };

  const handleSaveAssignment = (formData) => {
    if (modalData.existing) {
      updateAssignmentMutation.mutate({
        id: modalData.existing._id,
        ...formData
      });
    } else {
      createAssignmentMutation.mutate({
        scheduleId: selectedSchedule._id,
        employeeId: modalData.employee._id,
        date: modalData.date,
        ...formData
      });
    }
  };

  const handleDeleteAssignment = () => {
    if (modalData.existing) {
      deleteAssignmentMutation.mutate(modalData.existing._id);
    }
  };

  const handlePrevMonth = () => {
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    setSelectedSchedule(null);
  };

  const handleNextMonth = () => {
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    setSelectedSchedule(null);
  };

  const getAssignmentDisplay = (assignment) => {
    if (!assignment) return null;
    
    if (assignment.type === 'shift') {
      return `${assignment.startTime}-${assignment.endTime}`;
    } else if (assignment.type === 'leave') {
      return 'Urlop';
    } else if (assignment.type === 'off') {
      return 'Wolne';
    } else if (assignment.type === 'sick') {
      return 'L4';
    }
    return assignment.type;
  };

  const getAssignmentColor = (assignment) => {
    if (!assignment) return 'transparent';
    return assignment.color || '#3b82f6';
  };

  // Auto-select first schedule if available
  React.useEffect(() => {
    if (schedulesData && schedulesData.length > 0 && !selectedSchedule) {
      setSelectedSchedule(schedulesData[0]);
    }
  }, [schedulesData, selectedSchedule]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
              }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Grafik pracy (Nowy)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Widok miesięczny - siatka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handlePrevMonth} className="btn-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 min-w-[150px] text-center">
              {new Date(year, month - 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="btn-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Schedule Selection / Creation */}
      {!selectedSchedule && schedulesData && schedulesData.length === 0 && (
        <div className="app-card p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Brak grafiku dla wybranego miesiąca
          </p>
          <button onClick={handleCreateSchedule} className="btn-primary">
            Utwórz nowy grafik
          </button>
        </div>
      )}

      {/* Schedule Grid */}
      {selectedSchedule && (
        <div className="app-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {selectedSchedule.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedSchedule.status === 'published' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {selectedSchedule.status === 'published' ? 'Opublikowany' : 'Wersja robocza'}
              </span>
            </div>
          </div>

          {scheduleLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                   style={{ borderColor: 'var(--theme-primary)' }}></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-700 p-2 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600">
                      Pracownik
                    </th>
                    {daysInMonth.map((date, index) => (
                      <th 
                        key={index}
                        className="p-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 min-w-[80px]"
                      >
                        <div>{date.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                        <div className="font-bold">{date.getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeesData?.map((employee) => (
                    <tr key={employee._id}>
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 p-2 text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600">
                        {employee.firstName} {employee.lastName}
                      </td>
                      {daysInMonth.map((date, index) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const key = `${employee._id}-${dateStr}`;
                        const assignment = assignmentsByEmployeeAndDate[key];
                        
                        return (
                          <td 
                            key={index}
                            onClick={() => handleCellClick(employee, date)}
                            className="p-1 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            {assignment && (
                              <div 
                                className="px-2 py-1 rounded text-xs text-white text-center font-medium"
                                style={{ backgroundColor: getAssignmentColor(assignment) }}
                              >
                                {getAssignmentDisplay(assignment)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && modalData && (
        <AssignmentModal
          data={modalData}
          onSave={handleSaveAssignment}
          onDelete={handleDeleteAssignment}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ data, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    type: data.existing?.type || 'shift',
    startTime: data.existing?.startTime || '08:00',
    endTime: data.existing?.endTime || '16:00',
    notes: data.existing?.notes || '',
    color: data.existing?.color || '#3b82f6'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {data.existing ? 'Edytuj przypisanie' : 'Dodaj przypisanie'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pracownik
            </label>
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {data.employee.firstName} {data.employee.lastName}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Data
            </label>
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {new Date(data.date).toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Typ
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-primary"
            >
              <option value="shift">Zmiana</option>
              <option value="leave">Urlop</option>
              <option value="off">Wolne</option>
              <option value="sick">L4</option>
            </select>
          </div>

          {formData.type === 'shift' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Od
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Do
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kolor
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notatka
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea-primary"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            {data.existing && (
              <button
                type="button"
                onClick={onDelete}
                className="btn-secondary flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Usuń
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Anuluj
            </button>
            <button type="submit" className="btn-primary flex-1">
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleBuilderV2;
