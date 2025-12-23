import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const DEFAULT_COLOR = '#ec4899'; // Pink-500

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState(() => {
    const stored = localStorage.getItem('kadryhr_theme_color');
    return stored || DEFAULT_COLOR;
  });

  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem('kadryhr_theme_mode');
    return stored || 'system';
  });

  // Detect system theme preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Apply theme mode to document
  useEffect(() => {
    const root = document.documentElement;
    
    let effectiveTheme = themeMode;
    if (themeMode === 'system') {
      effectiveTheme = getSystemTheme();
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('kadryhr_theme_mode', themeMode);
  }, [themeMode]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Update CSS custom properties when theme color changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Set primary color
    root.style.setProperty('--theme-primary', themeColor);
    
    // Generate secondary color (slightly lighter/darker variant)
    const secondary = adjustColor(themeColor, 10);
    root.style.setProperty('--theme-secondary', secondary);
    
    // Generate lighter variants for backgrounds
    const light = adjustColor(themeColor, 40);
    root.style.setProperty('--theme-light', light);
    
    // Generate very light variant for subtle backgrounds
    const veryLight = adjustColor(themeColor, 60);
    root.style.setProperty('--theme-very-light', veryLight);
    
    // Save to localStorage
    localStorage.setItem('kadryhr_theme_color', themeColor);
  }, [themeColor]);

  const updateThemeColor = (color) => {
    setThemeColor(color);
  };

  const resetThemeColor = () => {
    setThemeColor(DEFAULT_COLOR);
  };

  const updateThemeMode = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ 
      themeColor, 
      updateThemeColor, 
      resetThemeColor,
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
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}
