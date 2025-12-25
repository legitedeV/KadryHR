import React from 'react';
import { useAuth } from '../context/AuthContext';

const DemoBanner = () => {
  const { user } = useAuth();

  // Only show banner if user email is demo account
  if (!user || user.email !== 'demo@kadryhr.pl') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 shadow-lg border-b border-amber-600">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold">
              Tryb Demo - Testujesz wersję demonstracyjną KadryHR
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-all duration-200"
          >
            Utwórz konto
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
