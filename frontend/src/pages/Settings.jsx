import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Alert from '../components/Alert';

const Settings = () => {
  const { themeColor, updateThemeColor, resetThemeColor, themeMode, updateThemeMode } = useTheme();
  const [selectedColor, setSelectedColor] = useState(themeColor);
  const [selectedMode, setSelectedMode] = useState(themeMode);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    updateThemeColor(newColor);
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    updateThemeMode(mode);
  };

  const handleReset = () => {
    const defaultColor = '#ec4899';
    setSelectedColor(defaultColor);
    resetThemeColor();
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

  const presetColors = [
    { name: 'Różowy (domyślny)', color: '#ec4899' },
    { name: 'Fioletowy', color: '#a855f7' },
    { name: 'Niebieski', color: '#3b82f6' },
    { name: 'Zielony', color: '#10b981' },
    { name: 'Pomarańczowy', color: '#f97316' },
    { name: 'Czerwony', color: '#ef4444' },
    { name: 'Turkusowy', color: '#06b6d4' },
    { name: 'Żółty', color: '#eab308' },
  ];

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
            <p className="text-sm text-slate-500 dark:text-slate-400">Dostosuj wygląd aplikacji do swoich preferencji</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Theme Mode Selection */}
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

      {/* Theme Color Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Kolor motywu</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Wybierz kolor, który będzie używany w całej aplikacji. Zmiana koloru wpłynie na przyciski, 
              gradienty, latające elementy i inne akcenty wizualne.
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={handleColorChange}
                  className="w-24 h-24 rounded-xl cursor-pointer border-4 border-slate-200 dark:border-slate-700 shadow-lg hover:scale-105 transition-transform"
                  style={{ 
                    background: selectedColor,
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Wybrany kolor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        updateThemeColor(e.target.value);
                      }
                    }}
                    className="input-primary font-mono uppercase"
                    placeholder="#ec4899"
                    maxLength={7}
                  />
                  <button
                    onClick={handleReset}
                    className="btn-secondary whitespace-nowrap"
                  >
                    Resetuj
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Colors */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Gotowe kolory
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => {
                    setSelectedColor(preset.color);
                    updateThemeColor(preset.color);
                  }}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedColor.toLowerCase() === preset.color.toLowerCase()
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg shadow-md"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                    {preset.name}
                  </span>
                  {selectedColor.toLowerCase() === preset.color.toLowerCase() && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-slate-900 dark:text-slate-100" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Podgląd
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button 
                  className="btn-primary"
                  style={{
                    background: `linear-gradient(to right, ${selectedColor}, ${selectedColor}dd)`,
                    boxShadow: `0 10px 25px -5px ${selectedColor}40`,
                  }}
                >
                  Przycisk główny
                </button>
                <button 
                  className="btn-secondary"
                  style={{
                    borderColor: `${selectedColor}40`,
                    color: selectedColor,
                  }}
                >
                  Przycisk drugorzędny
                </button>
                <div 
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: `${selectedColor}20`,
                    color: selectedColor,
                  }}
                >
                  Znacznik
                </div>
              </div>
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${selectedColor}10, ${selectedColor}05)`,
                  borderLeft: `4px solid ${selectedColor}`,
                }}
              >
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  To jest przykładowy tekst pokazujący, jak wybrany kolor będzie wyglądał w różnych elementach interfejsu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Zapisz ustawienia</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kliknij przycisk, aby zapisać swoje preferencje na serwerze
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zapisywanie...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Zapisz
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
