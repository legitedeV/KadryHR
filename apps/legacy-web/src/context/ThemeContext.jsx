import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const BRAND_THEME = {
  primary: '#2563eb',
  secondary: '#0ea5e9',
};

const STORAGE_KEYS = {
  mode: 'kadryhr_theme_mode',
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.mode);
    return stored || 'dark';
  });

  // Detect system theme preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const applyModeToRoot = (mode) => {
    const root = document.documentElement;
    root.dataset.theme = 'dark';
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  };

  // Explicitly lock the UI to dark mode to match the current design
  const applyDarkMode = () => {
    applyModeToRoot('dark');
  };

  // Apply theme mode to document
  useEffect(() => {
    applyModeToRoot(themeMode);
    localStorage.setItem(STORAGE_KEYS.mode, themeMode);
  }, [themeMode]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      applyModeToRoot('system');
    };

    // initial sync
    applyModeToRoot('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Apply fixed brand colors across the entire application
  useEffect(() => {
    const root = document.documentElement;
    const themeColor = BRAND_THEME.primary;

    root.style.setProperty('--theme-primary', themeColor);
    root.style.setProperty('--theme-secondary', BRAND_THEME.secondary);

    const light = mixColor(themeColor, '#ffffff', 0.85);
    root.style.setProperty('--theme-light', light);

    const veryLight = mixColor(themeColor, '#ffffff', 0.92);
    root.style.setProperty('--theme-very-light', veryLight);

    const dark = adjustColor(themeColor, -18);
    root.style.setProperty('--theme-dark', dark);

    const surfaceLight = mixColor(themeColor, '#f8fafc', 0.95);
    root.style.setProperty('--surface-light', surfaceLight);

    const surfaceDark = mixColor(themeColor, '#0f172a', 0.15);
    root.style.setProperty('--surface-dark', surfaceDark);

    const rgb = hexToRgb(themeColor);
    root.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }, []);

  // Ensure correct theme applied on initial render and lock to dark
  useEffect(() => {
    applyDarkMode();
  }, []);

  const updateThemeMode = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{
      themeColor: BRAND_THEME.primary,
      themeMode,
      updateThemeMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Helper function to adjust color brightness
function adjustColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function mixColor(color1, color2, ratio) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const mix = (c1, c2) => Math.round(c1 * ratio + c2 * (1 - ratio));

  const r = mix(rgb1.r, rgb2.r);
  const g = mix(rgb1.g, rgb2.g);
  const b = mix(rgb1.b, rgb2.b);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 }; // fallback to brand blue
}
