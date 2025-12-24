import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const EVENT_TYPES = [
  { value: 'employee.created', label: 'Pracownik utworzony' },
  { value: 'employee.updated', label: 'Pracownik zaktualizowany' },
  { value: 'employee.deactivated', label: 'Pracownik dezaktywowany' },
  { value: 'leave.created', label: 'Wniosek urlopowy utworzony' },
  { value: 'leave.statusChanged', label: 'Status wniosku zmieniony' },
  { value: 'schedule.updated', label: 'Grafik zaktualizowany' },
  { value: 'task.assigned', label: 'Zadanie przypisane' },
  { value: 'task.completed', label: 'Zadanie ukończone' },
];

const Webhooks = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState(null);
  const [form, setForm] = useState({
    url: '',
    eventTypes: [],
    secret: '',
  });

  // Fetch webhooks
  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data } = await api.get('/webhooks');
      return data;
    },
  });

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/webhooks', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['webhooks']);
      setCreatedWebhook(data.webhook);
      setShowSecretModal(true);
      setShowCreateModal(false);
      setForm({ url: '', eventTypes: [], secret: '' });
    },
  });

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { data } = await api.patch(`/webhooks/${id}`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
    },
  });

  // Test webhook mutation
  const testMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/webhooks/${id}/test`);
      return data;
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleEventTypeToggle = (eventType) => {
    setForm(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(t => t !== eventType)
        : [...prev.eventTypes, eventType],
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const webhooks = webhooksData?.webhooks || [];

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Webhooks
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Konfiguruj webhooks do integracji z zewnętrznymi systemami
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Dodaj webhook
          </button>
        </div>
      </div>

      {/* Webhooks list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner h-8 w-8 mx-auto"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Ładowanie...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="app-card p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">Brak skonfigurowanych webhooks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook._id}
              className="app-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {webhook.url}
                    </h3>
                    {webhook.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Aktywny
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        Nieaktywny
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Zdarzenia:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.eventTypes.map((eventType) => (
                          <span
                            key={eventType}
                            className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {EVENT_TYPES.find(t => t.value === eventType)?.label || eventType}
                          </span>
                        ))}
                      </div>
                    </div>

                    {webhook.lastTriggeredAt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ostatnie wywołanie: {new Date(webhook.lastTriggeredAt).toLocaleString('pl-PL')}
                      </p>
                    )}

                    {webhook.failureCount > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Błędy: {webhook.failureCount} {webhook.lastError && `(${webhook.lastError})`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => testMutation.mutate(webhook._id)}
                    disabled={testMutation.isLoading}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Testuj webhook"
                  >
                    <ArrowPathIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: webhook._id, isActive: !webhook.isActive })}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title={webhook.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                  >
                    {webhook.isActive ? (
                      <XCircleIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Czy na pewno chcesz usunąć ten webhook?')) {
                        deleteMutation.mutate(webhook._id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Usuń"
                  >
                    <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Dodaj nowy webhook
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  URL webhookaendpoint
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Typy zdarzeń
                </label>
                <div className="space-y-2">
                  {EVENT_TYPES.map((eventType) => (
                    <label
                      key={eventType.value}
                      className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.eventTypes.includes(eventType.value)}
                        onChange={() => handleEventTypeToggle(eventType.value)}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {eventType.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Secret (opcjonalny)
                </label>
                <input
                  type="text"
                  value={form.secret}
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  placeholder="Zostaw puste aby wygenerować automatycznie"
                  className="input-field"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Secret jest używany do podpisywania żądań HMAC SHA-256
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || form.eventTypes.length === 0}
                  className="btn-primary flex-1"
                >
                  {createMutation.isLoading ? 'Tworzenie...' : 'Utwórz webhook'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Anuluj
                </button>
              </div>

              {createMutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Błąd: {createMutation.error?.response?.data?.message || 'Nie udało się utworzyć webhooka'}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Secret Modal */}
      {showSecretModal && createdWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Webhook utworzony!
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Zapisz poniższy secret - nie będzie ponownie wyświetlony!
              </p>

              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
                    {createdWebhook.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdWebhook.secret)}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    title="Kopiuj"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSecretModal(false);
                  setCreatedWebhook(null);
                }}
                className="btn-primary w-full"
              >
                Rozumiem, zapisałem secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Webhooks;
