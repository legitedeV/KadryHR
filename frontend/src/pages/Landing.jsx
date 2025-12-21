import React from 'react';
import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Grafiki i zamiany',
    desc: 'Buduj miesięczne grafiki, pilnuj kolizji i wspieraj zamiany zmian między pracownikami.',
  },
  {
    title: 'Urlopy i L4',
    desc: 'Pracownicy wysyłają wnioski, a Ty widzisz statusy i blokujesz nachodzące się zmiany.',
  },
  {
    title: 'Sugestie zespołu',
    desc: 'Zbieraj pomysły i problemy z jednego panelu, aby usprawnić komunikację.',
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
              KH
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">KadryHR</div>
              <p className="text-xs text-slate-500">Stabilny HR & payroll</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Zaloguj
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Utwórz konto
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100 shadow-sm">
              End-to-end HR dla zespołów
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Stabilny login + panel pracownika z urlopami, grafikiem i sugestiami.
            </h1>
            <p className="text-base text-slate-600">
              KadryHR łączy zgłaszanie urlopów, zamiany zmian, kreator grafiku oraz prosty panel
              sugestii w jednym miejscu. Zostało zbudowane pod Node 20 + React, gotowe do wdrożenia
              pod PM2 i Nginx.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Przejdź do logowania
              </Link>
              <Link
                to="/app"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-white hover:border-indigo-200"
              >
                Zobacz panel
              </Link>
            </div>
          </div>

          <div className="app-card p-6 bg-white/90">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-indigo-700">Token JWT</div>
                <div className="text-sm text-slate-600">Cookies + nagłówek Bearer dla stabilnego logowania</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                JWT
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Weryfikujemy token z ciasteczka lub nagłówka Authorization.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Proste komunikaty błędów dla wygasłych / brakujących tokenów.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Gotowe pod Nginx z proxy_pass /api.</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-slate-700">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-lg font-bold text-slate-900">7d</div>
                <div className="text-[11px] text-slate-500">Domyślny czas ważności tokenu</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-lg font-bold text-slate-900">PM2</div>
                <div className="text-[11px] text-slate-500">Zgodność z Node 20</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-lg font-bold text-slate-900">HTTPS</div>
                <div className="text-[11px] text-slate-500">Secure cookie w produkcji</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((item) => (
            <div key={item.title} className="app-card p-4 bg-white/90">
              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
              <p className="text-xs text-slate-600 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
