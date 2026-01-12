"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Produkt", href: "/#produkt" },
  { label: "Funkcje", href: "/#funkcje" },
  { label: "Cennik", href: "/#cennik" },
  { label: "Bezpieczeństwo", href: "/security" },
  { label: "Kontakt", href: "/kontakt" },
];

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-all ${
        scrolled
          ? "border-surface-800/60 bg-surface-950/80 backdrop-blur"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-xl font-semibold text-surface-50 transition-colors group-hover:text-brand-300">
            KadryHR
            <span className="text-brand-400">.pl</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-medium text-surface-300 transition-colors hover:text-brand-300"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-5 w-px bg-surface-700" />
          <Link href="/kontakt" className="btn-secondary">
            Umów demo
          </Link>
          <Link href="/register" className="btn-primary">
            Zacznij
          </Link>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-surface-800/60 bg-surface-900/70 p-2 text-surface-300 shadow-sm backdrop-blur hover:text-surface-50"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-surface-800/50 bg-surface-950/95 backdrop-blur md:hidden">
          <nav className="mx-auto max-w-6xl space-y-3 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-xl px-4 py-3 font-medium text-surface-300 transition-colors hover:bg-surface-800/50 hover:text-brand-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2">
              <Link
                href="/kontakt"
                className="block btn-secondary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Umów demo
              </Link>
              <Link
                href="/register"
                className="block btn-primary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Zacznij
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
