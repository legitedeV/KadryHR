"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pl" className="dark">
      <body className="antialiased bg-surface-950 text-surface-50">
        <main className="min-h-screen px-6 flex items-center justify-center">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
              KadryHR
            </p>
            <h1 className="text-3xl font-semibold">Coś poszło nie tak</h1>
            <p className="text-sm text-surface-300">
              Spróbuj ponownie lub wróć za chwilę. Jeśli problem będzie się powtarzał,
              skontaktuj się z zespołem wsparcia.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button className="btn-primary px-5 py-2" onClick={() => reset()}>
                Spróbuj ponownie
              </button>
              <a href="/" className="btn-secondary px-5 py-2">
                Strona główna
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
