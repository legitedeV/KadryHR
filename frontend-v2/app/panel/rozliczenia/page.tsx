"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { getAuthTokens } from "@/lib/auth";
import { pushToast } from "@/lib/toast";

interface Subscription {
  plan: string;
  status: string;
  trialEndsAt: string | null;
}

export default function RozliczeniaPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const tokens = getAuthTokens();
      const response = await fetch(`${API_BASE_URL}/subscriptions/me`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      pushToast({
        variant: "error",
        title: "Nie udało się pobrać danych subskrypcji",
      });
    } finally {
      setLoading(false);
    }
  }

  const planNames: Record<string, string> = {
    FREE_TRIAL: "Darmowy okres próbny",
    BASIC: "Plan podstawowy",
    PROFESSIONAL: "Plan profesjonalny",
    ENTERPRISE: "Plan enterprise",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card p-6">
        <h1 className="text-2xl font-bold text-surface-50">Rozliczenia</h1>
        <p className="text-sm text-surface-400 mt-1">
          Zarządzaj swoją subskrypcją i płatnościami
        </p>
      </div>

      {loading ? (
        <div className="panel-card p-6">
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm text-surface-400">Ładowanie...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Current Plan */}
          <div className="panel-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-surface-50">Aktualny plan</h2>
                <p className="text-sm text-surface-400 mt-1">
                  Szczegóły Twojej subskrypcji
                </p>
              </div>
              <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-surface-800/60 bg-surface-950/40">
                <div>
                  <div className="text-sm text-surface-400">Plan</div>
                  <div className="text-lg font-semibold text-surface-50 mt-1">
                    {planNames[subscription?.plan || "FREE_TRIAL"] || subscription?.plan}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  subscription?.status === "ACTIVE" 
                    ? "bg-brand-900/30 text-brand-300" 
                    : "bg-surface-800/30 text-surface-300"
                }`}>
                  {subscription?.status === "ACTIVE" ? "Aktywny" : subscription?.status}
                </span>
              </div>

              {subscription?.trialEndsAt && (
                <div className="p-4 rounded-xl border border-accent-800/60 bg-accent-950/20">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-surface-50">Okres próbny</div>
                      <div className="text-sm text-surface-400 mt-1">
                        Twój okres próbny kończy się: {new Date(subscription.trialEndsAt).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Section */}
          <div className="panel-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-surface-50">Zmień plan</h2>
                <p className="text-sm text-surface-400 mt-1">
                  Dostępne plany subskrypcji
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Plan */}
              <div className="p-4 rounded-xl border border-surface-800/60 bg-surface-950/40">
                <div className="text-lg font-semibold text-surface-50 mb-2">Podstawowy</div>
                <div className="text-2xl font-bold text-brand-400 mb-4">
                  99 zł<span className="text-sm font-normal text-surface-400">/miesiąc</span>
                </div>
                <ul className="space-y-2 mb-4 text-sm text-surface-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Do 20 pracowników
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Podstawowe funkcje
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Email support
                  </li>
                </ul>
                <button disabled className="w-full px-4 py-2 rounded-xl bg-surface-800/50 text-surface-400 cursor-not-allowed">
                  Wkrótce dostępne
                </button>
              </div>

              {/* Professional Plan */}
              <div className="p-4 rounded-xl border-2 border-brand-700 bg-brand-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-semibold text-surface-50">Profesjonalny</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-900/50 text-brand-300">
                    Polecany
                  </span>
                </div>
                <div className="text-2xl font-bold text-brand-400 mb-4">
                  199 zł<span className="text-sm font-normal text-surface-400">/miesiąc</span>
                </div>
                <ul className="space-y-2 mb-4 text-sm text-surface-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Do 100 pracowników
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Wszystkie funkcje
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Priorytetowy support
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Zaawansowane raporty
                  </li>
                </ul>
                <button disabled className="w-full px-4 py-2 rounded-xl bg-surface-800/50 text-surface-400 cursor-not-allowed">
                  Wkrótce dostępne
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="p-4 rounded-xl border border-surface-800/60 bg-surface-950/40">
                <div className="text-lg font-semibold text-surface-50 mb-2">Enterprise</div>
                <div className="text-2xl font-bold text-brand-400 mb-4">
                  Kontakt
                </div>
                <ul className="space-y-2 mb-4 text-sm text-surface-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Nielimitowana liczba pracowników
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Dedykowany opiekun
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Custom integracje
                  </li>
                </ul>
                <button disabled className="w-full px-4 py-2 rounded-xl bg-surface-800/50 text-surface-400 cursor-not-allowed">
                  Wkrótce dostępne
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="panel-card p-6 border-l-4 border-accent-500">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-surface-50">Funkcja w przygotowaniu</h3>
                <p className="text-sm text-surface-400 mt-1">
                  System płatności i zarządzania subskrypcją jest obecnie w fazie rozwoju.
                  Możesz korzystać z pełnej funkcjonalności systemu przez cały okres próbny.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
