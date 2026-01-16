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
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-surface-800/50 bg-surface-950/90 backdrop-blur-xl shadow-lg shadow-surface-950/20"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2 relative">
          <BrandLogoMotion size={40} variant="full" withPL className="text-surface-50" />
        </Link>
        
        <nav className="hidden items-center gap-6 lg:gap-8 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative font-medium text-surface-300 transition-colors hover:text-surface-50 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-brand-500 after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-5 w-px bg-surface-700/50" />
          <Link 
            href="/kontakt" 
            className="btn-secondary px-4 py-2 text-sm"
          >
            Umów demo
          </Link>
          <Link 
            href="/register" 
            className="btn-primary px-4 py-2 text-sm"
          >
            Zacznij
          </Link>
        </nav>
        
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-surface-800/60 bg-surface-900/80 p-2.5 text-surface-300 shadow-sm backdrop-blur hover:text-surface-50 hover:border-surface-700/60 transition-all"
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
        <div className="border-t border-surface-800/50 bg-surface-950/98 backdrop-blur-xl md:hidden">
          <nav className="mx-auto max-w-6xl space-y-2 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-xl px-4 py-3 font-medium text-surface-300 transition-all hover:bg-surface-800/50 hover:text-surface-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-surface-800/50 mt-2">
              <Link
                href="/kontakt"
                className="block btn-secondary text-center py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Umów demo
              </Link>
              <Link
                href="/register"
                className="block btn-primary text-center py-3"
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
