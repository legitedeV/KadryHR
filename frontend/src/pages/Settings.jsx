import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useTheme } from '../context/ThemeContext';
import PermissionBadge from '../components/PermissionBadge';
import api from '../utils/api';

const Settings = () => {
  const { themeMode, updateThemeMode } = useTheme();
  const { permissions, isAdmin } = usePermissions();
  const [selectedMode, setSelectedMode] = useState(themeMode);
  const [_loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [_error, setError] = useState(null);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    updateThemeMode(mode);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put('/auth/theme-preference', {
        themePreference: selectedMode,
      });

      setSuccess('Ustawienia zapisane pomyślnie');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się zapisać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const themeModes = [
    {
      id: 'light',
      name: 'Tryb jasny',
      description: 'Jasny motyw dla lepszej widoczności w dzień',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'dark',
      name: 'Tryb ciemny',
      description: 'Ciemny motyw dla lepszej widoczności w nocy',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      id: 'system',
      name: 'Systemowy',
      description: 'Automatycznie dostosowuje się do ustawień systemu',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ustawienia</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Spójne, brandowe UI w całej aplikacji</p>
          </div>
        </div>
      </div>

      {/* Brand Theme Description */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Motyw interfejsu</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Wybierz preferowany motyw aplikacji. Tryb systemowy automatycznie dostosuje się do ustawień Twojego systemu operacyjnego.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedMode === mode.id
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                style={selectedMode === mode.id ? {
                  borderColor: 'var(--theme-primary)',
                  backgroundColor: `rgba(var(--theme-primary-rgb), 0.05)`
                } : {}}
              >
                <div
                  className="transition-colors duration-200"
                  style={selectedMode === mode.id ? { color: 'var(--theme-primary)' } : {}}
                >
                  {mode.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mode.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{mode.description}</p>
                </div>
                {selectedMode === mode.id && (
                  <div className="absolute top-3 right-3">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Theme Description */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kolorystyka KadryHR</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Cały interfejs korzysta z jednego, konsekwentnego motywu opartego na niebieskim gradiencie z landing page&apos;a. Karty, przyciski i tła korzystają teraz z brandowych zmiennych kolorów, więc wszystkie moduły wyglądają identycznie.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                color: '#fff',
                boxShadow: '0 10px 25px -10px rgba(var(--theme-primary-rgb),0.45)'
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white/80"></span>
              Brandowy gradient
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-gradient-layout shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm" />
              <div className="relative space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Warstwa kart</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">Zaokrąglone rogi, delikatne cienie i gradienty tła z landing page&apos;a.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(var(--theme-primary-rgb),0.08), rgba(var(--theme-primary-rgb),0.02))'
              }}
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Akcenty</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">Przyciski i chipy korzystają z brandowego gradientu oraz delikatnych poświat.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-900/60">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Spójność</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">Brak selektorów kolorów – jedna paleta zapewnia jednolite doświadczenie na wszystkich ekranach.</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Permissions */}
      {!isAdmin && permissions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Twoje uprawnienia
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uprawnienia przypisane do Twojego konta
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm) => (
              <PermissionBadge key={perm} permission={perm} hasPermission={true} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
