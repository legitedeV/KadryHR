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
    return stored || 'dark';
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

    // Set data-theme attribute for CSS variables
    root.setAttribute('data-theme', effectiveTheme);
    
    // Keep .dark class for backward compatibility
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
      const effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      
      // Set data-theme attribute
      root.setAttribute('data-theme', effectiveTheme);
      
      // Keep .dark class for backward compatibility
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
    const secondary = adjustColor(themeColor, 8);
    root.style.setProperty('--theme-secondary', secondary);
    
    // Generate lighter variants for backgrounds
    const light = mixColor(themeColor, '#ffffff', 0.85);
    root.style.setProperty('--theme-light', light);
    
    // Generate very light variant for subtle backgrounds
    const veryLight = mixColor(themeColor, '#ffffff', 0.92);
    root.style.setProperty('--theme-very-light', veryLight);
    
    // Generate darker variant for hover states
    const dark = adjustColor(themeColor, -18);
    root.style.setProperty('--theme-dark', dark);
    
    // Update surface colors for themes
    const surfaceLight = mixColor(themeColor, '#f8fafc', 0.95);
    root.style.setProperty('--surface-light', surfaceLight);

    const surfaceDark = mixColor(themeColor, '#0f172a', 0.15);
    root.style.setProperty('--surface-dark', surfaceDark);
    
    // Generate RGB values for opacity usage
    const rgb = hexToRgb(themeColor);
    root.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    
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
  } : { r: 236, g: 72, b: 153 }; // fallback to default pink
}
