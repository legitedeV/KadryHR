import Link from "next/link";
import { KadryButton } from "./KadryButton";

const navItems = [
  { label: "Funkcje", href: "/funkcje" },
  { label: "Cennik", href: "/cennik" },
  { label: "Materiały", href: "/materialy" },
  { label: "Klienci", href: "/klienci" },
  { label: "Kontakt", href: "/kontakt" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-emerald-950">
          KadryHR
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-emerald-800 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-emerald-500">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <KadryButton variant="ghost" size="sm" href="/kontakt">
            Umów prezentację
          </KadryButton>
          <KadryButton size="sm" href="/cennik">
            Wypróbuj za darmo
          </KadryButton>
        </div>
      </div>
    </header>
  );
}
