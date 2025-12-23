import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { themeColor, updateThemeColor, resetThemeColor } = useTheme();
  const [selectedColor, setSelectedColor] = useState(themeColor);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Track if there are unsaved changes
  useEffect(() => {
    setHasChanges(selectedColor !== themeColor);
  }, [selectedColor, themeColor]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
  };

  const handleSave = () => {
    updateThemeColor(selectedColor);
    setHasChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    const defaultColor = '#ec4899';
    setSelectedColor(defaultColor);
    resetThemeColor();
    setHasChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-theme-gradient-br flex items-center justify-center shadow-lg shadow-theme">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ustawienia</h1>
            <p className="text-sm text-slate-500">Dostosuj wygląd aplikacji do swoich preferencji</p>
          </div>
        </div>
      </div>

      {/* Theme Color Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Kolor motywu</h2>
            <p className="text-sm text-slate-600 mb-6">
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
                  className="w-24 h-24 rounded-xl cursor-pointer border-4 border-slate-200 shadow-lg hover:scale-105 transition-transform"
                  style={{ 
                    background: selectedColor,
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wybrany kolor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
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
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Gotowe kolory
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => {
                    setSelectedColor(preset.color);
                  }}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedColor.toLowerCase() === preset.color.toLowerCase()
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg shadow-md"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-xs font-medium text-slate-700 text-center">
                    {preset.name}
                  </span>
                  {selectedColor.toLowerCase() === preset.color.toLowerCase() && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="pt-6 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
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
                <p className="text-sm text-slate-700">
                  To jest przykładowy tekst pokazujący, jak wybrany kolor będzie wyglądał w różnych elementach interfejsu.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 animate-fade-in">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Ustawienia zostały zapisane!</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasChanges ? 'Zapisz zmiany' : 'Zapisano'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Inne ustawienia</h2>
        <p className="text-sm text-slate-600">
          Więcej opcji personalizacji będzie dostępnych wkrótce.
        </p>
      </div>
    </div>
  );
};

export default Settings;
