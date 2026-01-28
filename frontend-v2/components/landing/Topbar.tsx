export function Topbar() {
  return (
    <div className="border-b border-slate-200 bg-slate-50/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <a className="transition hover:text-slate-900" href="mailto:kontakt@kadryhr.pl">
            kontakt@kadryhr.pl
          </a>
          <span className="text-slate-300">|</span>
          <a className="transition hover:text-slate-900" href="tel:+48223071120">
            +48 22 307 11 20
          </a>
        </div>
        <div className="hidden items-center gap-2 text-slate-500 sm:flex" aria-label="Szybkie wyszukiwanie">
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8.5 15.5C12.0899 15.5 15 12.5899 15 9C15 5.41015 12.0899 2.5 8.5 2.5C4.91015 2.5 2 5.41015 2 9C2 12.5899 4.91015 15.5 8.5 15.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Wyszukaj</span>
        </div>
      </div>
    </div>
  );
}
