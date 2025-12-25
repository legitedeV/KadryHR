import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const AdminRequests = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch leave requests
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['admin-leaves', selectedFilter],
    queryFn: async () => {
      const params = selectedFilter !== 'all' ? { status: selectedFilter } : {};
      const { data } = await api.get('/leaves', { params });
      return data;
    }
  });

  // Update leave status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const { data } = await api.patch(`/leaves/${id}/status`, { status, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-leaves']);
      queryClient.invalidateQueries(['leaves']);
      setSuccess('Status wniosku został zaktualizowany');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować statusu');
    }
  });

  const handleStatusChange = (leaveId, newStatus) => {
    updateStatusMutation.mutate({ id: leaveId, status: newStatus });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[status] || badges.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Oczekujące',
      approved: 'Zatwierdzone',
      rejected: 'Odrzucone',
      on_hold: 'Wstrzymane',
    };
    return labels[status] || status;
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      annual: 'Urlop wypoczynkowy',
      on_demand: 'Urlop na żądanie',
      unpaid: 'Urlop bezpłatny',
      occasional: 'Urlop okolicznościowy',
    };
    return types[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Panel Admina - Wnioski
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Zarządzanie wnioskami pracowników
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <div className="app-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtruj:</span>
          {['all', 'pending', 'approved', 'rejected', 'on_hold'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === filter
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
              style={selectedFilter === filter ? {
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`
              } : {}}
            >
              {filter === 'all' ? 'Wszystkie' : getStatusLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="app-card p-6">
        {leavesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                 style={{ borderColor: 'var(--theme-primary)' }}></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie wniosków...</p>
          </div>
        ) : !leavesData || leavesData.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Brak wniosków
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Nie znaleziono wniosków urlopowych dla wybranego filtra.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Pracownik</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Typ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Okres</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Dni</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {leavesData.map((leave) => (
                  <tr key={leave._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {leave.employee?.position || 'Pracownik'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                      {getLeaveTypeLabel(leave.type)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {leave.daysCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(leave.status)}`}>
                        {getStatusLabel(leave.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {leave.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(leave._id, 'approved')}
                            disabled={updateStatusMutation.isLoading}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Zatwierdź"
                          >
                            Zatwierdź
                          </button>
                        )}
                        {leave.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(leave._id, 'rejected')}
                            disabled={updateStatusMutation.isLoading}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Odrzuć"
                          >
                            Odrzuć
                          </button>
                        )}
                        {leave.status !== 'on_hold' && (
                          <button
                            onClick={() => handleStatusChange(leave._id, 'on_hold')}
                            disabled={updateStatusMutation.isLoading}
                            className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Wstrzymaj"
                          >
                            Wstrzymaj
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
