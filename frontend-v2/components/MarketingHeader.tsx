import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/">
          <Logo size={40} showText={true} />
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
