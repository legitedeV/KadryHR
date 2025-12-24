import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Permissions = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Fetch all permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get('/permissions');
      return data;
    },
  });

  // Fetch users with permissions
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-permissions'],
    queryFn: async () => {
      const { data } = await api.get('/permissions/users');
      return data;
    },
  });

  // Assign permissions mutation
  const assignPermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }) => {
      const { data } = await api.post('/permissions/assign', {
        userId,
        permissions,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users-permissions']);
      setSuccess('Uprawnienia zostały zaktualizowane');
      setShowModal(false);
      setSelectedUser(null);
      setSelectedPermissions([]);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować uprawnień');
    },
  });

  // Initialize permissions mutation
  const initPermissionsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/permissions/initialize');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      setSuccess('Uprawnienia zostały zainicjalizowane');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zainicjalizować uprawnień');
    },
  });

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    if (!searchTerm) return usersData;
    
    const term = searchTerm.toLowerCase();
    return usersData.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [usersData, searchTerm]);

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setShowModal(true);
  };

  const togglePermission = (permissionName) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    assignPermissionsMutation.mutate({
      userId: selectedUser._id,
      permissions: selectedPermissions,
    });
  };

  const getModuleIcon = (module) => {
    const icons = {
      dashboard: '📊',
      employees: '👥',
      payroll: '💰',
      schedule: '📅',
      time_tracking: '⏰',
      chat: '💬',
      reports: '📈',
      requests: '📋',
      leaves: '🏖️',
      notifications: '🔔',
      settings: '⚙️',
      self_service: '👤',
    };
    return icons[module] || '📦';
  };

  const getModuleLabel = (module) => {
    const labels = {
      dashboard: 'Dashboard',
      employees: 'Pracownicy',
      payroll: 'Wynagrodzenia',
      schedule: 'Grafik',
      time_tracking: 'Czas pracy',
      chat: 'Wiadomości',
      reports: 'Raporty',
      requests: 'Wnioski',
      leaves: 'Urlopy',
      notifications: 'Powiadomienia',
      settings: 'Ustawienia',
      self_service: 'Panel pracownika',
    };
    return labels[module] || module;
  };

  const getCategoryBadge = (category) => {
    const badges = {
      view: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      edit: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      manage: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return badges[category] || 'bg-slate-100 text-slate-700';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      view: 'Widok',
      create: 'Tworzenie',
      edit: 'Edycja',
      delete: 'Usuwanie',
      manage: 'Zarządzanie',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              }}
            >
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Zarządzanie uprawnieniami
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Przypisuj uprawnienia do modułów dla pracowników
              </p>
            </div>
          </div>

          <button
            onClick={() => initPermissionsMutation.mutate()}
            disabled={initPermissionsMutation.isLoading}
            className="btn-secondary text-xs"
          >
            {initPermissionsMutation.isLoading ? 'Inicjalizacja...' : 'Inicjalizuj uprawnienia'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Search */}
      <div className="app-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj użytkownika..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="app-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserGroupIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Użytkownicy ({filteredUsers.length})
          </h2>
        </div>

        {usersLoading ? (
          <div className="text-center py-8">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
              style={{ borderColor: 'var(--theme-primary)' }}
            ></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500 dark:text-slate-400">Nie znaleziono użytkowników</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{
                          background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {user.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === 'admin' || user.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Użytkownik'}
                      </span>
                      {user.hasCustomPermissions && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {user.permissions.length} uprawnień
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditPermissions(user)}
                    className="btn-secondary text-xs whitespace-nowrap"
                  >
                    Zarządzaj uprawnieniami
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {showModal && selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="border-b border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Uprawnienia: {selectedUser.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {selectedUser.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {permissionsLoading ? (
                    <div className="text-center py-8">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                        style={{ borderColor: 'var(--theme-primary)' }}
                      ></div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie uprawnień...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {permissionsData?.grouped &&
                        Object.entries(permissionsData.grouped).map(([module, perms]) => (
                          <div key={module} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getModuleIcon(module)}</span>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {getModuleLabel(module)}
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {perms.map((perm) => {
                                const isSelected = selectedPermissions.includes(perm.name);
                                return (
                                  <button
                                    key={perm._id}
                                    onClick={() => togglePermission(perm.name)}
                                    className={`text-left rounded-lg border p-3 transition-all ${
                                      isSelected
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {perm.displayName}
                                          </span>
                                          <span
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${getCategoryBadge(
                                              perm.category
                                            )}`}
                                          >
                                            {getCategoryLabel(perm.category)}
                                          </span>
                                        </div>
                                        {perm.description && (
                                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {perm.description}
                                          </p>
                                        )}
                                      </div>
                                      <div
                                        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-green-500'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                      >
                                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Wybrano: <span className="font-semibold">{selectedPermissions.length}</span> uprawnień
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowModal(false)}
                        className="btn-secondary"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={handleSavePermissions}
                        disabled={assignPermissionsMutation.isLoading}
                        className="btn-primary"
                      >
                        {assignPermissionsMutation.isLoading ? 'Zapisywanie...' : 'Zapisz uprawnienia'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Permissions;
