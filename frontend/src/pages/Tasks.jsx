import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const Tasks = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    priority: '',
  });

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = {};
      if (filters.employeeId) params.employeeId = filters.employeeId;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      
      const { data } = await api.get('/tasks', { params });
      return data.tasks || [];
    },
  });

  // Fetch employees for dropdown
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['tasks', 'employees'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/employees');
      return data.employees || [];
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const { data } = await api.post('/tasks', taskData);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowModal(false);
      setSelectedTask(null);
      setSuccess('Zadanie utworzone pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się utworzyć zadania');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }) => {
      const { data } = await api.patch(`/tasks/${id}`, taskData);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowModal(false);
      setSelectedTask(null);
      setSuccess('Zadanie zaktualizowane pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować zadania');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setSuccess('Zadanie usunięte pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się usunąć zadania');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      employeeId: formData.get('employeeId'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      scheduledDate: formData.get('scheduledDate') || null,
    };

    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask._id, ...taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      assigned: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Przypisane' },
      in_progress: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', text: 'W trakcie' },
      completed: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Wykonane' },
      rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Odrzucone' },
      completed_late: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Wykonane (późno)' },
    };
    const style = styles[status] || styles.assigned;
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', text: 'Niska' },
      medium: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Średnia' },
      high: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Wysoka' },
    };
    const style = styles[priority] || styles.medium;
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.text}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`,
              }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Zadania</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Zarządzaj zadaniami pracowników</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTask(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj zadanie
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pracownik
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="input-primary"
            >
              <option value="">Wszyscy</option>
              {employeesData?.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-primary"
            >
              <option value="">Wszystkie</option>
              <option value="assigned">Przypisane</option>
              <option value="in_progress">W trakcie</option>
              <option value="completed">Wykonane</option>
              <option value="rejected">Odrzucone</option>
              <option value="completed_late">Wykonane (późno)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Priorytet
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input-primary"
            >
              <option value="">Wszystkie</option>
              <option value="low">Niska</option>
              <option value="medium">Średnia</option>
              <option value="high">Wysoka</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {tasksLoading ? (
          <div className="p-12 text-center">
            <div className="spinner h-8 w-8 mx-auto"></div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie zadań...</p>
          </div>
        ) : !tasksData || tasksData.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: 'var(--border-secondary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-600 dark:text-slate-400">Brak zadań</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Zadanie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pracownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Priorytet
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tasksData.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900 dark:text-slate-100">{task.employee?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowModal(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Czy na pewno chcesz usunąć to zadanie?')) {
                            deleteTaskMutation.mutate(task._id);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--surface-overlay)' }}
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--border-primary)', border: '1px solid' }}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                {selectedTask ? 'Edytuj zadanie' : 'Nowe zadanie'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tytuł *
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedTask?.title}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Opis *
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedTask?.description}
                    rows={4}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pracownik *
                  </label>
                  <select
                    name="employeeId"
                    defaultValue={selectedTask?.employee?._id}
                    className="input-primary"
                    required
                    disabled={employeesLoading}
                  >
                    <option value="">
                      {employeesLoading ? 'Ładowanie pracowników...' : 'Wybierz pracownika'}
                    </option>
                    {employeesData && employeesData.length > 0 ? (
                      employeesData.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} {emp.email ? `(${emp.email})` : ''}
                        </option>
                      ))
                    ) : (
                      !employeesLoading && (
                        <option value="" disabled>
                          Brak dostępnych pracowników
                        </option>
                      )
                    )}
                  </select>
                  {!employeesLoading && (!employeesData || employeesData.length === 0) && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Brak aktywnych pracowników w systemie
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Data wykonania *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      defaultValue={selectedTask?.dueDate?.split('T')[0]}
                      className="input-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Data w grafiku
                    </label>
                    <input
                      type="date"
                      name="scheduledDate"
                      defaultValue={selectedTask?.scheduledDate?.split('T')[0]}
                      className="input-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Priorytet *
                  </label>
                  <select
                    name="priority"
                    defaultValue={selectedTask?.priority || 'medium'}
                    className="input-primary"
                    required
                  >
                    <option value="low">Niska</option>
                    <option value="medium">Średnia</option>
                    <option value="high">Wysoka</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                    className="btn-primary"
                  >
                    {createTaskMutation.isPending || updateTaskMutation.isPending
                      ? 'Zapisywanie...'
                      : selectedTask
                      ? 'Zapisz zmiany'
                      : 'Utwórz zadanie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
