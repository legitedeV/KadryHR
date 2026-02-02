import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-white py-14">
      <div className="landing-container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo variant="compact" size="sm" />
          <p className="text-sm text-slate-600">
            Nowoczesne wsparcie kadrowo-płacowe i consulting HR dla firm w całej Polsce.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Firma</p>
          <a href="#o-nas" className="block transition hover:text-slate-900">
            O nas
          </a>
          <Link href="/blog" className="block transition hover:text-slate-900">
            Blog
          </Link>
          <a href="#kontakt" className="block transition hover:text-slate-900">
            Kontakt
          </a>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Usługi</p>
          <a href="#uslugi" className="block transition hover:text-slate-900">
            Kadry i płace
          </a>
          <a href="#uslugi" className="block transition hover:text-slate-900">
            Rekrutacje
          </a>
          <a href="#uslugi" className="block transition hover:text-slate-900">
            Doradztwo HR
          </a>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Kontakt</p>
          <a href="mailto:kontakt@kadryhr.pl" className="block transition hover:text-slate-900">
            kontakt@kadryhr.pl
          </a>
          <a href="tel:+48223071120" className="block transition hover:text-slate-900">
            +48 22 307 11 20
          </a>
          <div className="flex gap-3 pt-2 text-slate-500">
            <a href="https://www.linkedin.com" aria-label="LinkedIn">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5ZM.4 8.6H4.6V24H.4V8.6ZM8.4 8.6H12.4V10.7H12.46C13.02 9.68 14.38 8.6 16.42 8.6 20.74 8.6 21.6 11.24 21.6 15.18V24H17.4V16.1C17.4 14.08 17.36 11.52 14.66 11.52 11.92 11.52 11.5 13.68 11.5 15.96V24H7.3V8.6H8.4Z" />
              </svg>
            </a>
            <a href="https://www.facebook.com" aria-label="Facebook">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.68 0H1.32C.6 0 0 .6 0 1.32V22.7C0 23.4.6 24 1.32 24H12.8V14.7H9.68V11.1H12.8V8.4C12.8 5.3 14.74 3.6 17.54 3.6C18.86 3.6 20 3.7 20.3 3.74V6.98H18.24C16.64 6.98 16.3 7.76 16.3 8.92V11.1H20.2L19.68 14.7H16.3V24H22.68C23.4 24 24 23.4 24 22.68V1.32C24 .6 23.4 0 22.68 0Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="landing-container mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
        <span>© 2024 KadryHR. Wszelkie prawa zastrzeżone.</span>
        <span>Polityka prywatności · Regulamin</span>
      </div>
    </footer>
  );
}
