import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Logo, LogoMark } from "@/components/brand/Logo";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/50 glass dark:border-surface-800/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="hidden sm:inline-flex">
            <Logo
              variant="full"
              size="sm"
              showTagline
              alt="KadryHR – Kadry i płace bez tajemnic"
              className="transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </span>
          <span className="flex items-center gap-2 sm:hidden">
            <LogoMark size="sm" alt="KadryHR" ariaLabel="KadryHR" />
            <span className="text-base font-semibold text-surface-900 dark:text-surface-50">KadryHR</span>
          </span>
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
