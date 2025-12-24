import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import Alert from '../components/Alert';

const Invites = () => {
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [lastLink, setLastLink] = useState('');
  const [lastEmailStatus, setLastEmailStatus] = useState(null);

  // Check if user has permission to manage invites (admin-level permission)
  const canManageInvites = hasPermission('employees.create') || user?.role === 'admin' || user?.role === 'super_admin';

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const { data } = await api.get('/invites');
      return data;
    },
    enabled: canManageInvites && !permissionsLoading,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/invites', payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['invites']);
      setEmail('');
      setRole('user');
      // Backend zwraca link w response.data.link
      if (response.data.link) {
        setLastLink(response.data.link);
      }
      
      // Zapisz status wysyłki email
      setLastEmailStatus({
        sent: response.data.emailSent,
        error: response.data.emailError,
        message: response.data.message,
      });
      
      // Pokaż informację o statusie wysyłki email
      if (response.data.emailSent) {
        console.log('✅ Email z zaproszeniem został wysłany');
      } else if (response.data.emailError) {
        console.warn('⚠️ Email nie został wysłany:', response.data.emailError);
      }
    },
    onError: (error) => {
      console.error('❌ Błąd tworzenia zaproszenia:', error);
      alert(error.response?.data?.message || 'Nie udało się utworzyć zaproszenia');
      setLastEmailStatus(null);
    },
  });

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Sprawdzanie uprawnień...</p>
        </div>
      </div>
    );
  }

  if (!canManageInvites) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
              Brak dostępu
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              Nie masz uprawnień do zarządzania zaproszeniami. Skontaktuj się z administratorem, aby uzyskać dostęp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Zaproszenia</h1>
        <p className="text-xs text-slate-500">
          Generuj linki zaproszeń do rejestracji nowych użytkowników.
        </p>
      </div>

      {createMutation.isError && (
        <Alert 
          type="error"
          title="Błąd tworzenia zaproszenia"
          message={createMutation.error?.response?.data?.message || 'Nie udało się utworzyć zaproszenia. Spróbuj ponownie.'}
          onClose={() => createMutation.reset()}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({ email, role });
        }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus-theme transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Rola</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus-theme transition-all duration-200"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full rounded-lg bg-theme-gradient text-white text-xs font-semibold py-2 shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
            >
              {createMutation.isLoading ? 'Tworzenie...' : 'Utwórz zaproszenie'}
            </button>
          </div>
        </div>

        {lastLink && (
          <div className={`border rounded-lg p-3 space-y-2 ${
            lastEmailStatus?.sent 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">
                {lastEmailStatus?.sent ? '✅' : '⚠️'}
              </span>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${
                  lastEmailStatus?.sent ? 'text-green-800' : 'text-amber-800'
                }`}>
                  {lastEmailStatus?.message || 'Zaproszenie utworzone'}
                </p>
                {!lastEmailStatus?.sent && lastEmailStatus?.error && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Powód: {lastEmailStatus.error}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-600">
              Link zaproszenia (skopiuj i wyślij ręcznie):
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={lastLink}
                className="flex-1 text-[11px] font-mono bg-white border border-slate-200 rounded px-2 py-1.5"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(lastLink);
                  alert('Link skopiowany do schowka!');
                }}
                className="px-3 py-1.5 bg-theme-gradient text-white text-[11px] font-semibold rounded shadow-md shadow-theme hover:shadow-lg hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200"
              >
                Kopiuj
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">
          Ostatnie zaproszenia
        </h2>
        {isLoading && (
          <p className="text-xs text-slate-500">Ładowanie...</p>
        )}
        {invites && invites.length === 0 && (
          <p className="text-xs text-slate-500">Brak zaproszeń.</p>
        )}
        {invites && invites.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">
                    Rola
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">
                    Ważne do
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">
                    Użyte
                  </th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv._id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{inv.email}</td>
                    <td className="px-3 py-2">{inv.role}</td>
                    <td className="px-3 py-2">
                      {new Date(inv.expiresAt).toLocaleString('pl-PL')}
                    </td>
                    <td className="px-3 py-2">
                      {inv.used ? 'TAK' : 'NIE'}
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

export default Invites;
