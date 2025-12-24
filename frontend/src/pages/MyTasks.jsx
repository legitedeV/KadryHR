import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const MyTasks = () => {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch my tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/my');
      return data.tasks || [];
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, comment, attachmentUrl }) => {
      const { data } = await api.post(`/tasks/${id}/complete`, { comment, attachmentUrl });
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-tasks']);
      setShowModal(false);
      setSelectedTask(null);
      setSuccess('Zadanie potwierdzone jako wykonane');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się potwierdzić wykonania');
    },
  });

  // Reject task mutation
  const rejectTaskMutation = useMutation({
    mutationFn: async ({ id, comment }) => {
      const { data } = await api.post(`/tasks/${id}/reject`, { comment });
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-tasks']);
      setShowModal(false);
      setSelectedTask(null);
      setSuccess('Zadanie odrzucone');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się odrzucić zadania');
    },
  });

  const handleComplete = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    completeTaskMutation.mutate({
      id: selectedTask._id,
      comment: formData.get('comment'),
      attachmentUrl: formData.get('attachmentUrl'),
    });
  };

  const handleReject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const comment = formData.get('comment');
    
    if (!comment || comment.trim() === '') {
      setError('Komentarz jest wymagany przy odrzuceniu zadania');
      return;
    }

    rejectTaskMutation.mutate({
      id: selectedTask._id,
      comment,
    });
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

  const isTaskActionable = (task) => {
    return task.status === 'assigned' || task.status === 'in_progress';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Moje zadania</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Zadania przypisane do Ciebie</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Tasks Grid */}
      {tasksLoading ? (
        <div className="app-card p-12 text-center">
          <div className="spinner h-8 w-8 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie zadań...</p>
        </div>
      ) : !tasksData || tasksData.length === 0 ? (
        <div className="app-card p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: 'var(--border-secondary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Brak przypisanych zadań</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasksData.map((task) => (
            <div
              key={task._id}
              className="app-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                {getPriorityBadge(task.priority)}
                {getStatusBadge(task.status)}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {task.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                {task.description}
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Termin: {new Date(task.dueDate).toLocaleDateString('pl-PL')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Utworzone przez: {task.createdBy?.name}</span>
                </div>
              </div>
              {task.employeeComment && (
                <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Twój komentarz:</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{task.employeeComment}</p>
                </div>
              )}
              {isTaskActionable(task) && (
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowModal(true);
                  }}
                  className="w-full btn-primary"
                >
                  Potwierdź / Odrzuć
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--surface-overlay)' }}
            onClick={() => setShowModal(false)}
          />
          <div className="relative app-card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {selectedTask.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {selectedTask.description}
              </p>

              {/* Complete Form */}
              <form onSubmit={handleComplete} className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Potwierdzam wykonanie
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Komentarz (opcjonalnie)
                  </label>
                  <textarea
                    name="comment"
                    rows={3}
                    className="input-primary"
                    placeholder="Dodaj komentarz do wykonanego zadania..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Link do zdjęcia/załącznika (opcjonalnie)
                  </label>
                  <input
                    type="url"
                    name="attachmentUrl"
                    className="input-primary"
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={completeTaskMutation.isPending}
                  className="w-full btn-primary"
                >
                  {completeTaskMutation.isPending ? 'Potwierdzanie...' : 'Potwierdzam wykonanie'}
                </button>
              </form>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                {/* Reject Form */}
                <form onSubmit={handleReject} className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Nie potwierdzam wykonania
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Powód odrzucenia *
                    </label>
                    <textarea
                      name="comment"
                      rows={3}
                      className="input-primary"
                      placeholder="Opisz powód, dla którego nie możesz wykonać tego zadania..."
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 btn-secondary"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={rejectTaskMutation.isPending}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {rejectTaskMutation.isPending ? 'Odrzucanie...' : 'Odrzuć zadanie'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
