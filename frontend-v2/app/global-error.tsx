"use client";

import { useCallback, useEffect } from "react";
import "./globals.css";
import { DEFAULT_LANG } from "@/lib/site-config";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let storedRequestId: string | null = null;
    try {
      storedRequestId = sessionStorage.getItem("kadryhr:last-request-id");
    } catch (storageError) {
      console.warn("[GlobalError] Unable to read request id from session storage", storageError);
    }
    const requestId =
      (error as { requestId?: string }).requestId ??
      storedRequestId ??
      undefined;
    const stack = typeof error.stack === "string" ? error.stack : undefined;
    console.error("[GlobalError]", {
      route: window.location.pathname,
      requestId,
      digest: error.digest,
      name: error.name,
      message: error.message,
      stack,
    });
  }, [error]);

  return (
    <html lang={DEFAULT_LANG}>
      <body className="antialiased bg-surface-100 text-surface-900">
        <main className="min-h-screen px-6 flex items-center justify-center">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
              KadryHR
            </p>
            <h1 className="text-3xl font-semibold">Coś poszło nie tak</h1>
            <p className="text-sm text-surface-600">
              Spróbuj ponownie lub wróć za chwilę. Jeśli problem będzie się powtarzał,
              skontaktuj się z zespołem wsparcia.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button className="btn-primary px-5 py-2" onClick={handleReset}>
                Spróbuj ponownie
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders outside router context, Link cannot be used */}
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
