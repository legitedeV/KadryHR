import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">KadryHR</p>
          <p className="text-sm text-slate-500">
            Nowoczesne zarządzanie grafikiem, czasem pracy i urlopami dla sieci retail i usług.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Produkt</p>
          <Link href="/cennik" className="block hover:text-slate-700">
            Cennik
          </Link>
          <Link href="/o-nas" className="block hover:text-slate-700">
            O nas
          </Link>
          <Link href="/kontakt" className="block hover:text-slate-700">
            Kontakt
          </Link>
        </div>
        <div className="space-y-2 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Dla zespołów</p>
          <Link href="/register" className="block hover:text-slate-700">
            Załóż konto
          </Link>
          <Link href="/login" className="block hover:text-slate-700">
            Logowanie
          </Link>
          <Link href="/newsletter" className="block hover:text-slate-700">
            Newsletter
          </Link>
        </div>
      </div>
    </footer>
  );
}
