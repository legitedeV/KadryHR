import Link from "next/link";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-sky-700 hover:text-sky-600">
          ← Powrót do strony głównej
        </Link>
        <h1 className="text-4xl font-semibold">Blog KadryHR</h1>
        <p className="text-base text-slate-600">
          Już wkrótce opublikujemy materiały o kadrach, płacach i trendach HR. Jeśli chcesz otrzymać
          powiadomienie o nowych publikacjach, skontaktuj się z nami.
        </p>
        <a
          href="/"
          className="inline-flex rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
        >
          Wróć do konsultacji
        </a>
      </div>
    </main>
  );
}
