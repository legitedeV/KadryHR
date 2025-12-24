import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Alert from '../components/Alert';

const AllNotifications = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setSuccess('Powiadomienie oznaczone jako przeczytane');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się oznaczyć powiadomienia');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setSuccess('Powiadomienie usunięte');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się usunąć powiadomienia');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/mark-all-read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setSuccess('Wszystkie powiadomienia oznaczone jako przeczytane');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się oznaczyć powiadomień');
    }
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/notifications');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setSuccess('Wszystkie powiadomienia zostały usunięte');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się usunąć powiadomień');
    }
  });

  const filteredNotifications = React.useMemo(() => {
    if (!notificationsData) return [];
    
    switch (selectedFilter) {
      case 'unread':
        return notificationsData.filter(n => !n.read);
      case 'read':
        return notificationsData.filter(n => n.read);
      default:
        return notificationsData;
    }
  }, [notificationsData, selectedFilter]);

  const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Powiadomienia
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : 'Wszystkie przeczytane'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isLoading}
                className="btn-secondary text-sm"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            )}
            {notificationsData && notificationsData.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Czy na pewno chcesz usunąć wszystkie powiadomienia? Ta operacja jest nieodwracalna.')) {
                    deleteAllNotificationsMutation.mutate();
                  }
                }}
                disabled={deleteAllNotificationsMutation.isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                Usuń wszystkie
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filter */}
      <div className="app-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtruj:</span>
          {['all', 'unread', 'read'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-theme-gradient text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {filter === 'all' ? 'Wszystkie' : filter === 'unread' ? 'Nieprzeczytane' : 'Przeczytane'}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="app-card p-6">
        {notificationsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                 style={{ borderColor: 'var(--theme-primary)' }}></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification._id}
                className={`p-4 border rounded-xl transition-all ${
                  notification.read
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    : 'border-theme-light dark:border-slate-600 bg-theme-very-light dark:bg-slate-700/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-theme-very-light0"></div>
                      )}
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {notification.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {notification.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsReadMutation.mutate(notification._id)}
                        disabled={markAsReadMutation.isLoading}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-theme-light text-theme-primary dark:bg-slate-700/50 dark:text-theme-primary hover:bg-pink-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Oznacz jako przeczytane
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => deleteNotificationMutation.mutate(notification._id)}
                        disabled={deleteNotificationMutation.isLoading}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Usuń powiadomienie"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>Brak powiadomień</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllNotifications;
