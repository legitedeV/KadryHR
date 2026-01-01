import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-soft">
            K
          </div>
          <div>
            <p className="text-sm font-semibold">KadryHR</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grafik i kadry dla sklepów
            </p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/cennik" className="hover:text-brand-600 dark:hover:text-brand-300">
            Cennik
          </Link>
          <Link href="/o-nas" className="hover:text-brand-600 dark:hover:text-brand-300">
            O nas
          </Link>
          <Link href="/kontakt" className="hover:text-brand-600 dark:hover:text-brand-300">
            Kontakt
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full bg-brand-500 px-4 py-2 font-medium text-white shadow-soft hover:bg-brand-600"
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
