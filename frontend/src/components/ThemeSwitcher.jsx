import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

/**
 * iOS-style theme switcher for unauthenticated pages
 * ON = Light mode, OFF = Dark mode
 */
const ThemeSwitcher = () => {
  const { themeMode, updateThemeMode } = useTheme();
  
  // Determine if light mode is active (considering system preference)
  const isLightMode = themeMode === 'light' || 
    (themeMode === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    // Simple toggle between light and dark (no system option for unauthenticated pages)
    updateThemeMode(isLightMode ? 'dark' : 'light');
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-lg border border-slate-200/60 dark:border-slate-700/60">
      {/* Moon Icon (Dark Mode) */}
      <MoonIcon 
        className={`w-4 h-4 transition-colors ${
          !isLightMode ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
        }`}
      />
      
      {/* iOS-style Toggle Switch */}
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
        style={
          isLightMode
            ? {
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 2px 8px rgba(var(--theme-primary-rgb), 0.3)`,
              }
            : {
                backgroundColor: '#64748b',
              }
        }
        aria-label={isLightMode ? 'Przełącz na tryb ciemny' : 'Przełącz na tryb jasny'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
            isLightMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Sun Icon (Light Mode) */}
      <SunIcon 
        className={`w-4 h-4 transition-colors ${
          isLightMode ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
        }`}
      />
    </div>
  );
};

export default ThemeSwitcher;
