"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/50 glass dark:border-surface-800/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-xl font-bold text-surface-900 dark:text-surface-50 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            KadryHR<span className="text-brand-600 dark:text-brand-400">.pl</span>
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
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-200/50 dark:border-surface-800/50 bg-white/95 dark:bg-surface-900/95 backdrop-blur-lg">
          <nav className="mx-auto max-w-6xl px-6 py-4 space-y-3">
            <Link
              href="/cennik"
              className="block px-4 py-3 rounded-xl font-medium text-surface-600 hover:bg-surface-100 hover:text-brand-600 dark:text-surface-300 dark:hover:bg-surface-800/50 dark:hover:text-brand-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cennik
            </Link>
            <Link
              href="/o-nas"
              className="block px-4 py-3 rounded-xl font-medium text-surface-600 hover:bg-surface-100 hover:text-brand-600 dark:text-surface-300 dark:hover:bg-surface-800/50 dark:hover:text-brand-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              O nas
            </Link>
            <Link
              href="/kontakt"
              className="block px-4 py-3 rounded-xl font-medium text-surface-600 hover:bg-surface-100 hover:text-brand-600 dark:text-surface-300 dark:hover:bg-surface-800/50 dark:hover:text-brand-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kontakt
            </Link>
            <div className="pt-3">
              <Link
                href="/login"
                className="block btn-primary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Zaloguj się
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
