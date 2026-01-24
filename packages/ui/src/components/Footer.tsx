import Link from "next/link";

const links = [
  { label: "Funkcje", href: "/funkcje" },
  { label: "Cennik", href: "/cennik" },
  { label: "Materiały", href: "/materialy" },
  { label: "Klienci", href: "/klienci" },
  { label: "Kontakt", href: "/kontakt" },
];

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-emerald-950">KadryHR</p>
            <p className="mt-2 max-w-sm text-sm text-emerald-800/80">
              Nowoczesne centrum zarządzania czasem pracy i zespołem. Harmonogramy,
              RCP online i ewidencja godzin w jednym miejscu.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-emerald-800">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-emerald-500">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 text-xs text-emerald-700/70 md:flex-row md:items-center md:justify-between">
          <span>© 2026 KadryHR. Wszelkie prawa zastrzeżone.</span>
          <span>kontakt@kadryhr.pl • +48 22 100 18 90</span>
        </div>
      </div>
    </footer>
  );
}
