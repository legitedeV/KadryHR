import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">KadryHR</h1>
        <p className="text-sm text-slate-400">
          Demo panelu – przejdź do logowania
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-50 hover:bg-emerald-500"
        >
          Przejdź do logowania
        </Link>
      </div>
    </main>
  );
}
