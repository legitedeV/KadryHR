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
      className={`inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-opacity dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 ${
        ready && isMounted ? "opacity-100" : "opacity-0"
      }`}
      aria-label="Przełącz motyw"
      aria-pressed={isDark}
      disabled={!isMounted}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full transition-all ${
          isDark
            ? "bg-amber-400 text-amber-950 shadow"
            : "bg-slate-200 text-slate-700"
        }`}
        aria-hidden
      >
        <span className="text-[13px]">💡</span>
      </span>
      <span className="hidden sm:inline">
        {isDark ? "Tryb ciemny" : "Tryb jasny"}
      </span>
    </button>
  );
}
