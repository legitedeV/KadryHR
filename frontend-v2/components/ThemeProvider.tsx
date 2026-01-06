"use client";

import {
  applyThemeClass,
  getStoredTheme,
  getSystemTheme,
  persistThemeSetting,
  resolveActiveTheme,
  Theme,
  ThemeSetting,
} from "@/lib/theme";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeContextValue = {
  theme: ThemeSetting;
  resolvedTheme: Theme;
  setTheme: (value: ThemeSetting) => void;
  systemTheme: Theme;
  isMounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isBrowser() {
  return typeof window !== "undefined";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    getSystemTheme(isBrowser() ? window.matchMedia.bind(window) : undefined),
  );
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() =>
    getStoredTheme(isBrowser() ? window.localStorage : undefined),
  );
  const isMounted = useMemo(() => isBrowser(), []);

  useEffect(() => {
    if (!isBrowser()) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches;
      setSystemTheme(matches ? "dark" : "light");
    };

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    const activeTheme = resolveActiveTheme(themeSetting, systemTheme);
    applyThemeClass(activeTheme);
    persistThemeSetting(themeSetting, isBrowser() ? window.localStorage : undefined);
  }, [systemTheme, themeSetting]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeSetting,
      resolvedTheme: resolveActiveTheme(themeSetting, systemTheme),
      setTheme: setThemeSetting,
      systemTheme,
      isMounted,
    }),
    [systemTheme, themeSetting, isMounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
