"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, isMounted } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200/80 bg-white/80 text-surface-600 shadow-sm backdrop-blur transition-all duration-300 hover:border-brand-300 hover:text-brand-600 dark:border-surface-700/80 dark:bg-surface-800/80 dark:text-surface-300 dark:hover:border-brand-600 dark:hover:text-brand-400 ${
        ready && isMounted ? "opacity-100" : "opacity-0"
      }`}
      aria-label="Przełącz motyw"
      aria-pressed={isDark}
      disabled={!isMounted}
    >
      <span className="sr-only">{isDark ? "Tryb ciemny" : "Tryb jasny"}</span>
      <svg
        className={`h-5 w-5 transition-transform duration-300 ${isDark ? "rotate-0 scale-100" : "rotate-90 scale-0 absolute"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg
        className={`h-5 w-5 transition-transform duration-300 ${!isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0 absolute"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </button>
  );
}
