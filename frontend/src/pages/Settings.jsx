import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import PermissionBadge from '../components/PermissionBadge';

const Settings = () => {
  const { permissions, isAdmin } = usePermissions();

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
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kolorystyka KadryHR</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Cały interfejs korzysta z jednego, konsekwentnego motywu opartego na niebieskim gradiencie z landing page&apos;a.
                Karty, przyciski i tła korzystają teraz z brandowych zmiennych kolorów i stałego trybu nocnego, dzięki czemu wszystkie moduły wyglądają identycznie.
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
              <p className="text-sm text-slate-700 dark:text-slate-200">Stały tryb nocny i jedna paleta zapewniają jednolite doświadczenie na wszystkich ekranach.</p>
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
