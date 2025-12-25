import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const SelfService = () => {
  const queryClient = useQueryClient();
  const [leavePayload, setLeavePayload] = useState({
    employeeId: '',
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [swapPayload, setSwapPayload] = useState({
    requesterEmployee: '',
    swapWithEmployee: '',
    date: '',
    reason: '',
  });

  const { data: employeesData, error: employeesError, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      return data.employees || [];
    },
    retry: 1,
  });

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/leaves');
      return data;
    },
  });

  const { data: swapRequests, error: swapRequestsError, isLoading: swapRequestsLoading } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: async () => {
      const { data } = await api.get('/swap-requests');
      return data;
    },
    retry: 1,
  });

  const leaveMutation = useMutation({
    mutationFn: (payload) => api.post('/leaves', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setLeavePayload({
        employeeId: '',
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
      });
    },
  });

  const swapMutation = useMutation({
    mutationFn: (payload) => api.post('/swap-requests', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      setSwapPayload({ requesterEmployee: '', swapWithEmployee: '', date: '', reason: '' });
    },
  });

  const compactEmployees = useMemo(() => employeesData || [], [employeesData]);
  const myLeaves = useMemo(() => (leavesData || []).slice(0, 5), [leavesData]);

  const hasAuthError = employeesError || swapRequestsError;
  const authErrorMessage = 
    employeesError?.response?.data?.message || 
    swapRequestsError?.response?.data?.message;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Zatwierdzony';
      case 'pending': return 'Oczekuje';
      case 'rejected': return 'Odrzucony';
      default: return status || 'Brak statusu';
    }
  };

  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case 'annual': return 'Urlop wypoczynkowy';
      case 'on_demand': return 'Urlop na żądanie';
      case 'unpaid': return 'Urlop bezpłatny';
      case 'occasional': return 'Urlop okolicznościowy';
      default: return 'Urlop';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel pracownika</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Zgłaszaj wnioski urlopowe oraz prośby o zamianę zmian
            </p>
          </div>
        </div>
      </div>

      {hasAuthError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Błąd autoryzacji</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {authErrorMessage || 'Wystąpił problem z autoryzacją. Spróbuj zalogować się ponownie.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {(employeesLoading || swapRequestsLoading || leavesLoading) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700 dark:text-blue-400">Ładowanie danych...</p>
          </div>
        </div>
      )}

      {/* Leave Request Card */}
      <div className="app-card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Wniosek urlopowy</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Zgłoś urlop do akceptacji administratora</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pracownik
                </label>
                <select
                  value={leavePayload.employeeId}
                  onChange={(e) => setLeavePayload((p) => ({ ...p, employeeId: e.target.value }))}
                  className="select-primary"
                >
                  <option value="">Wybierz pracownika</option>
                  {compactEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Typ urlopu
                </label>
                <select
                  value={leavePayload.type}
                  onChange={(e) => setLeavePayload((p) => ({ ...p, type: e.target.value }))}
                  className="select-primary"
                >
                  <option value="annual">Urlop wypoczynkowy</option>
                  <option value="on_demand">Urlop na żądanie</option>
                  <option value="unpaid">Urlop bezpłatny</option>
                  <option value="occasional">Urlop okolicznościowy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data od
                  </label>
                  <input
                    type="date"
                    value={leavePayload.startDate}
                    onChange={(e) => setLeavePayload((p) => ({ ...p, startDate: e.target.value }))}
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data do
                  </label>
                  <input
                    type="date"
                    value={leavePayload.endDate}
                    onChange={(e) => setLeavePayload((p) => ({ ...p, endDate: e.target.value }))}
                    className="input-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Powód (opcjonalnie)
                </label>
                <textarea
                  value={leavePayload.reason}
                  onChange={(e) => setLeavePayload((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                  className="textarea-primary"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => leaveMutation.mutate(leavePayload)}
                  disabled={leaveMutation.isLoading || !leavePayload.employeeId || !leavePayload.startDate || !leavePayload.endDate}
                  className="btn-primary"
                >
                  {leaveMutation.isLoading ? 'Wysyłanie...' : 'Złóż wniosek urlopowy'}
                </button>
              </div>

              {leaveMutation.isSuccess && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  Wniosek urlopowy został złożony pomyślnie!
                </div>
              )}

              {leaveMutation.isError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {leaveMutation.error?.response?.data?.message || 'Wystąpił błąd podczas składania wniosku'}
                </div>
              )}
            </div>
          </div>

          {/* Right: History */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Historia wniosków</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Ostatnie wnioski urlopowe</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {myLeaves.length === 0 && !leavesLoading && (
                <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  Brak wniosków urlopowych
                </div>
              )}

              {myLeaves.map((leave) => (
                <div key={leave._id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {getLeaveTypeLabel(leave.type)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(leave.startDate).toLocaleDateString('pl-PL')} - {new Date(leave.endDate).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(leave.status)}`}>
                      {getStatusLabel(leave.status)}
                    </span>
                  </div>
                  {leave.reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{leave.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Request Card */}
      <div className="app-card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Prośba o zamianę zmiany</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Wybierz datę i pracownika do zamiany</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ja / mój profil
                </label>
                <select
                  value={swapPayload.requesterEmployee}
                  onChange={(e) => setSwapPayload((p) => ({ ...p, requesterEmployee: e.target.value }))}
                  className="select-primary"
                >
                  <option value="">Wybierz swój profil</option>
                  {compactEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pracownik do zamiany
                </label>
                <select
                  value={swapPayload.swapWithEmployee}
                  onChange={(e) => setSwapPayload((p) => ({ ...p, swapWithEmployee: e.target.value }))}
                  className="select-primary"
                >
                  <option value="">Wybierz pracownika</option>
                  {compactEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data zmiany
                </label>
                <input
                  type="date"
                  value={swapPayload.date}
                  onChange={(e) => setSwapPayload((p) => ({ ...p, date: e.target.value }))}
                  className="input-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Powód (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={swapPayload.reason}
                  onChange={(e) => setSwapPayload((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Dodatkowe informacje..."
                  className="input-primary"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => swapMutation.mutate(swapPayload)}
                  disabled={swapMutation.isLoading || !swapPayload.requesterEmployee || !swapPayload.swapWithEmployee || !swapPayload.date}
                  className="btn-primary"
                >
                  {swapMutation.isLoading ? 'Wysyłanie...' : 'Poproś o zamianę'}
                </button>
              </div>

              {swapMutation.isSuccess && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  Prośba o zamianę została wysłana pomyślnie!
                </div>
              )}

              {swapMutation.isError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {swapMutation.error?.response?.data?.message || 'Wystąpił błąd podczas wysyłania prośby'}
                </div>
              )}
            </div>
          </div>

          {/* Right: History */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Historia zamian</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Ostatnie prośby o zamianę</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(swapRequests || []).length === 0 && !swapRequestsLoading && (
                <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  Brak próśb o zamianę
                </div>
              )}

              {(swapRequests || []).map((swap) => (
                <div key={swap._id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {swap.requesterEmployee?.firstName} {swap.requesterEmployee?.lastName}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Zamiana z {swap.swapWithEmployee?.firstName} {swap.swapWithEmployee?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(swap.date).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(swap.status)}`}>
                      {getStatusLabel(swap.status)}
                    </span>
                  </div>
                  {swap.reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{swap.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfService;
