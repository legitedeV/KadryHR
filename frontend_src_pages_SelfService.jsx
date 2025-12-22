import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const categoryLabels = {
  pomysl: 'Pomysł / ulepszenie',
  problem: 'Zgłoszenie problemu',
  proces: 'Usprawnienie procesu',
  inne: 'Inne',
};

const SelfService = () => {
  const queryClient = useQueryClient();
  const [suggestionPayload, setSuggestionPayload] = useState({
    title: '',
    content: '',
    category: 'pomysl',
  });
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
      console.log('[SelfService] Pobieranie listy pracowników...');
      const { data } = await api.get('/employees/compact');
      console.log('[SelfService] Pobrano pracowników:', data.employees?.length || 0);
      return data.employees || [];
    },
    retry: 1,
    onError: (err) => {
      console.error('[SelfService] Błąd pobierania pracowników:', err.response?.data?.message || err.message);
    },
  });

  const { data: suggestions, error: suggestionsError, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      console.log('[SelfService] Pobieranie sugestii...');
      const { data } = await api.get('/suggestions');
      console.log('[SelfService] Pobrano sugestie:', data?.length || 0);
      return data;
    },
    retry: 1,
    onError: (err) => {
      console.error('[SelfService] Błąd pobierania sugestii:', err.response?.data?.message || err.message);
    },
  });

  const { data: swapRequests, error: swapRequestsError, isLoading: swapRequestsLoading } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: async () => {
      console.log('[SelfService] Pobieranie próśb o zamianę...');
      const { data } = await api.get('/swap-requests');
      console.log('[SelfService] Pobrano prośby o zamianę:', data?.length || 0);
      return data;
    },
    retry: 1,
    onError: (err) => {
      console.error('[SelfService] Błąd pobierania próśb o zamianę:', err.response?.data?.message || err.message);
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: (payload) => api.post('/suggestions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      setSuggestionPayload({ title: '', content: '', category: 'pomysl' });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (payload) => api.post('/leaves', payload),
    onSuccess: () => setLeavePayload({
      employeeId: '',
      type: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
    }),
  });

  const swapMutation = useMutation({
    mutationFn: (payload) => api.post('/swap-requests', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      setSwapPayload({ requesterEmployee: '', swapWithEmployee: '', date: '', reason: '' });
    },
  });

  const compactEmployees = useMemo(() => employeesData || [], [employeesData]);

  // Sprawdź czy są błędy autoryzacji
  const hasAuthError = employeesError || suggestionsError || swapRequestsError;
  const authErrorMessage = 
    employeesError?.response?.data?.message || 
    suggestionsError?.response?.data?.message || 
    swapRequestsError?.response?.data?.message;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">Panel pracownika</h1>
        <p className="text-sm text-slate-600">
          Zgłaszaj sugestie, wnioski urlopowe oraz prośby o zamianę zmian w jednym miejscu.
        </p>
      </header>

      {hasAuthError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Błąd autoryzacji</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{authErrorMessage || 'Wystąpił problem z autoryzacją. Spróbuj zalogować się ponownie.'}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Przejdź do logowania
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(employeesLoading || suggestionsLoading || swapRequestsLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-sm text-blue-700">Ładowanie danych...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-4 space-y-3 lg:col-span-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Sugestie / pomysły</div>
            <p className="text-xs text-slate-600">Wyślij pomysł lub zgłoś problem do zespołu HR.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={suggestionPayload.title}
              onChange={(e) => setSuggestionPayload((p) => ({ ...p, title: e.target.value }))}
              placeholder="Tytuł"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={suggestionPayload.category}
              onChange={(e) => setSuggestionPayload((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={suggestionPayload.content}
            onChange={(e) => setSuggestionPayload((p) => ({ ...p, content: e.target.value }))}
            placeholder="Opisz swoją sugestię"
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => suggestionMutation.mutate(suggestionPayload)}
              disabled={suggestionMutation.isLoading}
              className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
            >
              {suggestionMutation.isLoading ? 'Wysyłanie...' : 'Dodaj sugestię'}
            </button>
          </div>

          <div className="pt-2 space-y-2">
            {(suggestions || []).map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{categoryLabels[item.category] || item.category}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-pink-700">{item.status}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.content}</p>
              </div>
            ))}
            {(suggestions || []).length === 0 && (
              <div className="text-xs text-slate-500">Brak sugestii. Dodaj pierwszą powyżej.</div>
            )}
          </div>
        </div>

        <div className="app-card p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Wniosek urlopowy</div>
            <p className="text-xs text-slate-600">Zgłoś urlop do akceptacji administratora.</p>
          </div>
          <select
            value={leavePayload.employeeId}
            onChange={(e) => setLeavePayload((p) => ({ ...p, employeeId: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Wybierz pracownika</option>
            {compactEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <select
            value={leavePayload.type}
            onChange={(e) => setLeavePayload((p) => ({ ...p, type: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="annual">Urlop wypoczynkowy</option>
            <option value="on_demand">Urlop na żądanie</option>
            <option value="unpaid">Urlop bezpłatny</option>
            <option value="occasional">Urlop okolicznościowy</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={leavePayload.startDate}
              onChange={(e) => setLeavePayload((p) => ({ ...p, startDate: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <input
              type="date"
              value={leavePayload.endDate}
              onChange={(e) => setLeavePayload((p) => ({ ...p, endDate: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <textarea
            value={leavePayload.reason}
            onChange={(e) => setLeavePayload((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Powód (opcjonalnie)"
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="button"
            onClick={() => leaveMutation.mutate(leavePayload)}
            disabled={leaveMutation.isLoading}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
          >
            {leaveMutation.isLoading ? 'Wysyłanie...' : 'Złóż wniosek urlopowy'}
          </button>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-600">
              Po akceptacji przez admina kolidujące zmiany w grafiku zostaną usunięte.
            </div>
          </div>
        </div>
      </div>

      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Prośba o zamianę zmiany</div>
            <p className="text-xs text-slate-600">Wybierz datę i pracownika, z którym chcesz się zamienić.</p>
          </div>
          <span className="text-[11px] font-semibold text-pink-700">Grafik</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={swapPayload.requesterEmployee}
            onChange={(e) => setSwapPayload((p) => ({ ...p, requesterEmployee: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Ja / mój profil</option>
            {compactEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <select
            value={swapPayload.swapWithEmployee}
            onChange={(e) => setSwapPayload((p) => ({ ...p, swapWithEmployee: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Pracownik do zamiany</option>
            {compactEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={swapPayload.date}
            onChange={(e) => setSwapPayload((p) => ({ ...p, date: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            value={swapPayload.reason}
            onChange={(e) => setSwapPayload((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Powód (opcjonalnie)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => swapMutation.mutate(swapPayload)}
            disabled={swapMutation.isLoading}
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
          >
            {swapMutation.isLoading ? 'Wysyłanie...' : 'Poproś o zamianę'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
          {(swapRequests || []).map((swap) => (
            <div key={swap._id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  {swap.requesterEmployee?.firstName} {swap.requesterEmployee?.lastName}
                </div>
                <span className="text-[11px] font-semibold text-pink-700">{swap.status}</span>
              </div>
              <div className="text-xs text-slate-600">
                Zamiana z {swap.swapWithEmployee?.firstName} {swap.swapWithEmployee?.lastName} - {new Date(swap.date).toLocaleDateString('pl-PL')}
              </div>
              {swap.reason && (
                <div className="text-[11px] text-slate-500 mt-1">{swap.reason}</div>
              )}
            </div>
          ))}
          {(swapRequests || []).length === 0 && (
            <div className="text-xs text-slate-500">Brak próśb o zamianę.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfService;
