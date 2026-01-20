"use client";

import { useState } from "react";

const STORAGE_KEY = "kadryhr-cookie-consent";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

function getInitialConsentState(): { visible: boolean; consent: ConsentState } {
  if (typeof window === "undefined") {
    return { visible: false, consent: defaultConsent };
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { visible: true, consent: defaultConsent };
  }
  try {
    return { visible: false, consent: JSON.parse(stored) };
  } catch {
    return { visible: true, consent: defaultConsent };
  }
}

export function CookieBanner() {
  const [state, setState] = useState<{ visible: boolean; consent: ConsentState }>(() => getInitialConsentState());
  const [showPreferences, setShowPreferences] = useState(false);
  
  const { visible, consent } = state;
  const setVisible = (v: boolean) => setState((s) => ({ ...s, visible: v }));
  const setConsent = (c: ConsentState) => setState((s) => ({ ...s, consent: c }));

  const saveConsent = (next: ConsentState) => {
    setConsent(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-3xl border border-surface-800/70 bg-surface-900/90 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-surface-50">
            Szanujemy Twoją prywatność
          </p>
          <p className="text-sm text-surface-300">
            Używamy plików cookie do działania serwisu, analityki i komunikacji marketingowej. Możesz zarządzać preferencjami.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-surface-400">
            <a href="/cookies" className="font-semibold text-brand-300 hover:text-brand-200">
              Polityka cookies
            </a>
            <span>·</span>
            <a href="/polityka-prywatnosci" className="font-semibold text-brand-300 hover:text-brand-200">
              Polityka prywatności
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowPreferences((prev) => !prev)}
            className="btn-secondary"
          >
            Preferencje
          </button>
          <button
            type="button"
            onClick={() =>
              saveConsent({
                ...consent,
                analytics: false,
                marketing: false,
                timestamp: new Date().toISOString(),
              })
            }
            className="btn-secondary"
          >
            Odrzuć nieobowiązkowe
          </button>
          <button
            type="button"
            onClick={() =>
              saveConsent({
                ...consent,
                analytics: true,
                marketing: true,
                timestamp: new Date().toISOString(),
              })
            }
            className="btn-primary"
          >
            Akceptuj wszystkie
          </button>
        </div>
      </div>
      {showPreferences && (
        <div className="mt-5 grid gap-3 rounded-2xl border border-surface-800/60 bg-surface-800/70 p-4 text-sm text-surface-200">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 rounded border-surface-300 text-brand-600" />
            <span>
              <strong>Niezbędne</strong> — wymagane do działania serwisu.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => setConsent((prev) => ({ ...prev, analytics: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-surface-300 text-brand-600"
            />
            <span>
              <strong>Analityczne</strong> — pomagają ulepszać produkt i treści.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) => setConsent((prev) => ({ ...prev, marketing: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-surface-300 text-brand-600"
            />
            <span>
              <strong>Marketingowe</strong> — pozwalają personalizować komunikację.
            </span>
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => saveConsent({ ...consent, timestamp: new Date().toISOString() })}
              className="btn-primary"
            >
              Zapisz ustawienia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
