import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full card p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-lg">
            K
          </div>
          <div className="text-left">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              KadryHR
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Panel grafiku i zespołu dla małych sklepów
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Zaloguj się, aby podejrzeć grafik, obsadę zmian i listę pracowników.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600"
          >
            Przejdź do logowania
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
