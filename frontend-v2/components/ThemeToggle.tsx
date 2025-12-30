"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "kadryhr_theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  function applyTheme(next: Theme) {
    if (typeof document === "undefined") return;
    const body = document.body;
    body.classList.remove("light", "dark");
    body.classList.add(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }

  useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY) as Theme | null)
      : null) as Theme | null;
    const prefersDark =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : prefersDark
        ? "dark"
        : "light";
    applyTheme(next);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(next);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
      aria-label="Przełącz motyw"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full transition-all ${
          isDark
            ? "bg-amber-400 text-amber-950 shadow"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        {/* ikonka żarówki */}
        <span className="text-[13px]">💡</span>
      </span>
      <span className="hidden sm:inline">
        {isDark ? "Tryb ciemny" : "Tryb jasny"}
      </span>
    </button>
  );
}
