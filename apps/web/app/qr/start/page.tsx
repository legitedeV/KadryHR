"use client";

import Link from "next/link";
import { useState } from "react";
import { appConfig } from "../../../lib/config";
import { useToast } from "../../providers";

export default function QrStartPage() {
  const [token, setToken] = useState("");
  const [location, setLocation] = useState("");
  const { pushToast } = useToast();

  const handleStart = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      pushToast("Podaj token publikacji wygenerowany w panelu", "error");
      return;
    }
    pushToast("Symuluję start sesji QR - podłącz skaner w trybie kiosk.", "success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="app-card p-8 max-w-3xl w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              Publiczny start QR
            </p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Uruchom rejestrację czasu przez QR
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Użyj tokenu publikacji wygenerowanego w module QR generator (bazowy URL API: {appConfig.apiUrl}). Wersja
              publiczna nie wymaga logowania — możesz uruchomić na kiosku lub tablecie.
            </p>
          </div>
          <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-tertiary)" }}>
              Wskazówki
            </div>
            <ul className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li>• Wklej token publikacji z panelu QR generator.</li>
              <li>• Podaj nazwę lokalizacji (np. "Recepcja A").</li>
              <li>• Po publikacji strona przejdzie w tryb pełnoekranowy.</li>
            </ul>
          </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleStart}>
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Token publikacji
            </label>
            <input
              className="input-primary mt-2"
              placeholder="np. qr_pub_abc123"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Lokalizacja (opcjonalnie)
            </label>
            <input
              className="input-primary mt-2"
              placeholder="np. Recepcja A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <button type="submit" className="btn-primary" style={{ paddingInline: "1.25rem" }}>
              Uruchom tryb QR
            </button>
            <Link href="/qr-generator" className="text-sm font-semibold hover:underline" style={{ color: "var(--text-secondary)" }}>
              Zarządzaj tokenami w panelu
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
