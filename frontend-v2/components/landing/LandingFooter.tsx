import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-surface-800/60 bg-surface-950/60 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-surface-400">KadryHR</p>
          <p className="text-sm text-surface-300">
            KadryHR porządkuje grafiki zmianowe, czas pracy i urlopy dla sieci retail oraz usług.
          </p>
        </div>
        <div className="space-y-2 text-sm text-surface-300">
          <p className="font-semibold text-surface-100">Produkt</p>
          <Link href="/#produkt" className="block hover:text-surface-50">
            Produkt
          </Link>
          <Link href="/cennik" className="block hover:text-surface-50">
            Cennik
          </Link>
          <Link href="/security" className="block hover:text-surface-50">
            Bezpieczeństwo
          </Link>
          <Link href="/kontakt" className="block hover:text-surface-50">
            Kontakt
          </Link>
        </div>
        <div className="space-y-2 text-sm text-surface-300">
          <p className="font-semibold text-surface-100">Dla zespołów</p>
          <Link href="/register" className="block hover:text-surface-50">
            Załóż konto
          </Link>
          <Link href="/login" className="block hover:text-surface-50">
            Logowanie
          </Link>
          <Link href="/newsletter" className="block hover:text-surface-50">
            Newsletter
          </Link>
        </div>
        <div className="space-y-2 text-sm text-surface-300">
          <p className="font-semibold text-surface-100">Legal</p>
          <Link href="/polityka-prywatnosci" className="block hover:text-surface-50">
            Polityka prywatności
          </Link>
          <Link href="/cookies" className="block hover:text-surface-50">
            Cookies
          </Link>
          <Link href="/regulamin" className="block hover:text-surface-50">
            Regulamin
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 px-6 text-xs text-surface-400 md:flex-row md:items-center md:justify-between">
        <span>© 2026 KadryHR. Wszelkie prawa zastrzeżone.</span>
        <span>Budujemy spokój operacyjny dla zespołów zmianowych.</span>
      </div>
    </footer>
  );
}
