import Link from "next/link";
import { LogIn, MessageCircle, Phone, UserPlus } from "lucide-react";

const navLinks = [
  { label: "Strona główna", href: "#" },
  { label: "Usługi", href: "#uslugi" },
  { label: "O nas", href: "#o-nas" },
  { label: "Blog", href: "/blog" },
  { label: "Kontakt", href: "#kontakt" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          KadryHR
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 btn-hero-outline"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Zaloguj
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 btn-hero"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Zarejestruj
          </Link>
          <a
            href="#kontakt"
            className="hidden items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 md:inline-flex"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Dodaj sprawę
          </a>
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Skontaktuj się
          </a>
        </div>
      </nav>
    </header>
  );
}
