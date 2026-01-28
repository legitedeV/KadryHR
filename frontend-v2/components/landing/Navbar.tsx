import Link from "next/link";

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
        <div className="flex items-center gap-3">
          <a
            href="#kontakt"
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 sm:inline-flex"
          >
            Dodaj sprawę
          </a>
          <a
            href="#kontakt"
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            Skontaktuj się
          </a>
        </div>
      </nav>
    </header>
  );
}
