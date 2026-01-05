import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/50 glass dark:border-surface-800/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-soft transition-transform duration-300 group-hover:scale-105">
            <span className="text-lg">K</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-surface-900 dark:text-surface-50">KadryHR</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Grafik i kadry dla sklepów
            </p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/cennik" className="font-medium text-surface-600 transition-colors hover:text-brand-600 dark:text-surface-300 dark:hover:text-brand-400">
            Cennik
          </Link>
          <Link href="/o-nas" className="font-medium text-surface-600 transition-colors hover:text-brand-600 dark:text-surface-300 dark:hover:text-brand-400">
            O nas
          </Link>
          <Link href="/kontakt" className="font-medium text-surface-600 transition-colors hover:text-brand-600 dark:text-surface-300 dark:hover:text-brand-400">
            Kontakt
          </Link>
          <div className="h-5 w-px bg-surface-200 dark:bg-surface-700" />
          <ThemeToggle />
          <Link
            href="/login"
            className="btn-primary"
          >
            Zaloguj się
          </Link>
        </nav>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
