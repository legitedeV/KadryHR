"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogoMotion } from "@/components/brand/BrandLogoMotion";

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
      className={`sticky top-0 z-40 border-b transition-all duration-700 ${
        scrolled
          ? "border-surface-800/40 bg-surface-950/85 backdrop-blur-2xl shadow-[0_18px_60px_-40px_rgba(15,17,20,0.7)]"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2 relative">
          <BrandLogoMotion size={40} variant="full" withPL className="text-surface-50" />
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-10 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative font-medium text-surface-300 transition-colors duration-500 hover:text-surface-50"
            >
              <span className="relative">
                {link.label}
                <span className="absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-brand-400/70 to-accent-400/70 transition-transform duration-500 group-hover:scale-x-100" />
              </span>
            </Link>
          ))}
          <div className="h-6 w-px bg-surface-700/50" />
          <Link href="/kontakt" className="btn-secondary px-4 py-2 text-sm">
            Umów demo
          </Link>
          <Link href="/login" className="btn-ghost px-4 py-2 text-sm">
            Zaloguj
          </Link>
          <Link href="/register" className="btn-primary px-4 py-2 text-sm">
            Rejestracja
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-surface-800/60 bg-surface-900/80 p-2.5 text-surface-300 shadow-sm backdrop-blur transition-all duration-500 hover:text-surface-50 hover:border-surface-700/60"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="border-t border-surface-800/50 bg-surface-950/98 backdrop-blur-2xl md:hidden">
          <nav className="mx-auto max-w-6xl space-y-2 px-6 py-5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-xl px-4 py-3 font-medium text-surface-300 transition-all duration-500 hover:bg-surface-800/40 hover:text-surface-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 space-y-3 border-t border-surface-800/50 pt-4">
              <Link
                href="/kontakt"
                className="block btn-secondary text-center py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Umów demo
              </Link>
              <Link
                href="/login"
                className="block btn-ghost text-center py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Zaloguj
              </Link>
              <Link
                href="/register"
                className="block btn-primary text-center py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Rejestracja
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
