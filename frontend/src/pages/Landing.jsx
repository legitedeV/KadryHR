import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FloatingParticles from '../components/FloatingParticles';
import ThemeSwitcher from '../components/ThemeSwitcher';

const features = [
  {
    title: 'Grafiki i dyżury',
    description: 'Buduj grafik miesięczny, blokuj konflikty i udostępniaj widoki zespołowi w jednym kliknięciu.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Urlopy i L4',
    description: 'Pracownicy składają wnioski online, a Ty zatwierdzasz je w przejrzystym panelu.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Czas pracy',
    description: 'Rejestracja wejść/wyjść, liczenie godzin i raporty gotowe do eksportu.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Powiadomienia',
    description: 'Automatyczne komunikaty e-mail i w aplikacji o zmianach, urlopach i nowych zadaniach.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-9 12h.01" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: 'Centralny kokpit',
    description: 'Jednolity layout dla wszystkich modułów – dashboard, grafiki, urlopy, wiadomości i zadania.',
  },
  {
    title: 'Płynne wdrożenie',
    description: 'Node 20 + React, gotowe do uruchomienia z PM2 i Nginx. Logowanie JWT działa od razu.',
  },
  {
    title: 'Stała kontrola',
    description: 'Uprawnienia, role i powiadomienia utrzymują porządek w rosnącym zespole.',
  },
];

const modules = [
  {
    title: 'Grafik',
    description: 'Planuj dyżury, rozdzielaj zadania i blokuj kolizje w czasie rzeczywistym.',
  },
  {
    title: 'Urlopy & L4',
    description: 'Zgłoszenia, zatwierdzanie, limitowanie puli dni oraz historia decyzji.',
  },
  {
    title: 'Czas pracy',
    description: 'Wejścia/wyjścia z QR, podgląd sesji oraz raporty do rozliczeń.',
  },
  {
    title: 'Powiadomienia',
    description: 'Automatyczne e-maile i in-app – nic nie umyka zespołowi.',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const { data } = await api.post('/auth/demo');

      if (data.token) {
        localStorage.setItem('kadryhr_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('kadryhr_user', JSON.stringify(data.user));
      }

      login(data.user);
      navigate('/app');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Nie udało się zalogować do wersji demo. Spróbuj ponownie.';
      alert(errorMessage);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-layout text-slate-800 dark:text-slate-100">
      <div className="absolute inset-0 opacity-50 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(37,99,235,0.12),transparent_38%)]" />
      <FloatingParticles count={14} minSize={50} maxSize={160} speed={0.7} />
      <ThemeSwitcher />

      <header className="sticky top-0 z-40 border-b border-white/40 dark:border-slate-800/70 backdrop-blur-xl bg-white/75 dark:bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
            >
              KH
            </div>
            <div>
              <p className="text-lg font-semibold">KadryHR</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nowoczesny system HR</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border"
              style={{
                borderColor: 'color-mix(in srgb, var(--border-primary) 90%, rgba(var(--theme-primary-rgb),0.25))',
                color: 'var(--text-secondary)',
              }}
            >
              Zaloguj się
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg text-white"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))', boxShadow: 'var(--shadow-md)' }}
            >
              Rozpocznij
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border"
              style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)', color: 'var(--theme-primary)', background: 'color-mix(in srgb, var(--theme-light) 70%, transparent)' }}
            >
              Kompleksowe HR w jednej aplikacji
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
              Zarządzaj zespołem z <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>jednego kokpitu</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              Spójny wygląd wszystkich modułów: dashboard, grafik, urlopy, L4, powiadomienia i czat. Bez chaosu, z naciskiem na przejrzystość.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl text-white shadow-xl"
                style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))', boxShadow: '0 16px 40px -20px rgba(var(--theme-primary-rgb),0.8)' }}
              >
                Utwórz konto
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl border"
                style={{
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, var(--border-primary))',
                  color: 'var(--theme-primary)',
                  background: 'rgba(var(--theme-primary-rgb),0.05)'
                }}
              >
                {isDemoLoading ? (
                  <>
                    <div className="spinner w-5 h-5" />
                    Ładowanie demo...
                  </>
                ) : (
                  <>
                    Wypróbuj demo
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              {['Szybkie wdrożenie', 'Bezpieczne logowanie', 'Responsywne UI'].map((item) => (
                <div key={item} className="app-card p-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="app-card p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status systemu</p>
                <p className="text-xl font-semibold">Stabilny i spójny</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>
                Nowy wygląd
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl p-4 border" style={{ borderColor: 'color-mix(in srgb, var(--border-primary) 90%, rgba(var(--theme-primary-rgb),0.25))' }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Panel główny</span>
                  <span className="text-emerald-500 font-semibold">online</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dashboard, grafik, urlopy, powiadomienia</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Backend</p>
                  <p className="text-lg font-semibold">Node 20</p>
                  <p className="text-xs text-emerald-500 mt-1">PM2 + Nginx</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Frontend</p>
                  <p className="text-lg font-semibold">React + Vite</p>
                  <p className="text-xs text-blue-500 mt-1">Tailwind + Context</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 border flex items-center gap-3" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Rozliczenia i czas pracy</p>
                  <p className="text-base font-semibold">Przygotowane raporty i eksporty</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="app-card p-5 flex flex-col gap-4 h-full">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 grid gap-6 lg:grid-cols-3">
          <div className="app-card p-6 lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Spójny frontend w każdej sekcji</h2>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(var(--theme-primary-rgb),0.08)', color: 'var(--theme-primary)' }}>
                Kompaktowy layout
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <div key={module.title} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{module.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{module.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Jak działamy</h3>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-20">
          <div className="app-card p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Zespół HR i liderzy</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Przejrzysty wygląd, szybkie wdrożenie</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
                KadryHR łączy moduły grafiku, urlopów, L4, czasu pracy i powiadomień w spójnym, kompaktowym interfejsie. Dzięki temu każdy widzi to samo – niezależnie od zakładki.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))', boxShadow: 'var(--shadow-md)' }}
              >
                Załóż konto
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl border"
                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, var(--border-primary))', color: 'var(--theme-primary)' }}
              >
                Mam już konto
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
