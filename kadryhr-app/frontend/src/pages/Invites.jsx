import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Invites = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [lastLink, setLastLink] = useState('');

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const { data } = await api.get('/invites');
      return data;
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/invites', payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['invites']);
      setEmail('');
      setRole('user');
      setLastLink(response.data.link);
    },
  });

  if (!isAdmin) {
    return (
      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        Tylko administrator ma dostęp do zarządzania zaproszeniami.
      </p>
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Rola</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 disabled:opacity-60"
            >
              Utwórz zaproszenie
            </button>
          </div>
        </div>

        {lastLink && (
          <p className="text-[11px] text-slate-600">
            Ostatni link zaproszenia:{' '}
            <span className="break-all font-mono bg-slate-50 px-2 py-1 rounded">
              {lastLink}
            </span>
          </p>
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
