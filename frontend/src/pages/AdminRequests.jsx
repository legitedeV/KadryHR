import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const AdminRequests = () => {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('suggestions');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['suggestions', selectedStatus],
    queryFn: async () => {
      const { data } = await api.get('/suggestions', {
        params: { status: selectedStatus }
      });
      return data || [];
    },
    enabled: selectedTab === 'suggestions'
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminResponse }) => {
      const { data } = await api.post(`/suggestions/${id}/approve`, { adminResponse });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suggestions']);
      setShowModal(false);
      setSuccess('Sugestia zatwierdzona pomyślnie');
      setAdminResponse('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zatwierdzić sugestii');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminResponse }) => {
      const { data } = await api.post(`/suggestions/${id}/reject`, { adminResponse });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suggestions']);
      setShowModal(false);
      setSuccess('Sugestia odrzucona pomyślnie');
      setAdminResponse('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się odrzucić sugestii');
    }
  });

  const handleApprove = () => {
    if (selectedItem) {
      approveMutation.mutate({
        id: selectedItem._id,
        adminResponse
      });
    }
  };

  const handleReject = () => {
    if (selectedItem) {
      rejectMutation.mutate({
        id: selectedItem._id,
        adminResponse
      });
    }
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setAdminResponse('');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return badges[status] || badges.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Oczekujące',
      approved: 'Zatwierdzone',
      rejected: 'Odrzucone',
      open: 'Otwarte',
      in_review: 'W trakcie',
      closed: 'Zamknięte'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type) => {
    return type === 'availability' ? 'Dostępność' : 'Inne';
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
              Zarządzanie wnioskami i sugestiami
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Tabs */}
      <div className="app-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedTab('suggestions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'suggestions'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            style={selectedTab === 'suggestions' ? {
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
            } : {}}
          >
            Sugestie / Dostępność
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</span>
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? getStatusBadge(status)
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Suggestions List */}
        {selectedTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                     style={{ borderColor: 'var(--theme-primary)' }}></div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
              </div>
            ) : suggestionsData && suggestionsData.length > 0 ? (
              suggestionsData.map((suggestion) => (
                <div 
                  key={suggestion._id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {suggestion.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(suggestion.status)}`}>
                          {getStatusLabel(suggestion.status)}
                        </span>
                        {suggestion.type && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {getTypeLabel(suggestion.type)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {suggestion.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Utworzone przez: {suggestion.createdBy?.name || 'Nieznany'}
                        </span>
                        <span>
                          {new Date(suggestion.createdAt).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                      {suggestion.adminResponse && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Odpowiedź admina:
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {suggestion.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                    {suggestion.status === 'pending' && (
                      <button
                        onClick={() => handleOpenModal(suggestion)}
                        className="btn-primary ml-4"
                      >
                        Rozpatrz
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p>Brak sugestii o statusie "{getStatusLabel(selectedStatus)}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Rozpatrz sugestię
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tytuł
                </h4>
                <p className="text-slate-900 dark:text-slate-100">{selectedItem.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Treść
                </h4>
                <p className="text-slate-900 dark:text-slate-100">{selectedItem.content}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Utworzone przez
                </h4>
                <p className="text-slate-900 dark:text-slate-100">
                  {selectedItem.createdBy?.name || 'Nieznany'} ({selectedItem.createdBy?.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Odpowiedź admina
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Wpisz odpowiedź..."
                  className="textarea-primary"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isLoading}
                  className="btn-secondary flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {rejectMutation.isLoading ? 'Odrzucanie...' : 'Odrzuć'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {approveMutation.isLoading ? 'Zatwierdzanie...' : 'Zatwierdź'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
