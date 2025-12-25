import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FloatingParticles from '../components/FloatingParticles';

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
  const [featureIndex, setFeatureIndex] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4800);

    return () => clearInterval(timer);
  }, []);

  const handleNextFeature = () => setFeatureIndex((prev) => (prev + 1) % features.length);
  const handlePrevFeature = () => setFeatureIndex((prev) => (prev - 1 + features.length) % features.length);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-layout text-slate-800 dark:text-slate-100">
      <div className="absolute inset-0 opacity-50 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_40%)]" />
      <FloatingParticles count={14} minSize={50} maxSize={160} speed={0.7} />

      <header className="sticky top-0 z-40 border-b border-white/30 dark:border-slate-800/70 backdrop-blur-2xl bg-white/80 dark:bg-slate-950/70">
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
            <span
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full text-white shadow-lg"
              style={{
                background: 'linear-gradient(120deg, #0ea5e9, #2563eb, #8b5cf6)',
                borderColor: 'transparent',
              }}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {['Grafik', 'Urlopy i L4', 'Czas pracy'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/60 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-4 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.55)]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Moduł</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/60 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Zespół</p>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(var(--theme-primary-rgb),0.1)', color: 'var(--theme-primary)' }}>Na bieżąco</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Aktywni pracownicy', value: '48' },
                  { label: 'Oczekujące wnioski', value: '6' },
                  { label: 'Zaplanowane zmiany', value: '124' },
                  { label: 'Spóźnienia', value: '0' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/60 dark:border-slate-800/70 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-6 shadow-xl">
              <p className="text-sm uppercase tracking-[0.14em] text-blue-200">Nowy wygląd</p>
              <p className="text-2xl font-semibold mt-2">Ujednolicone zakładki, kompaktowe karty i jeden język designu</p>
              <p className="text-sm text-blue-100 mt-3">Dashboard, grafik, wnioski, powiadomienia i chat korzystają z tych samych komponentów UI.</p>
            </div>
          </div>
        </section>

        <section className="bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl border-y border-white/50 dark:border-slate-800/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 space-y-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Funkcje</p>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Kompaktowy zestaw narzędzi HR</h2>
                <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-sky-600 dark:text-sky-300">Przejdź do panelu →</Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">Każdy moduł korzysta z tych samych kart, tabel i stanów. Łatwiej szkolić zespół, bo interfejs jest przewidywalny niezależnie od miejsca w aplikacji.</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/80 bg-gradient-to-r from-white via-slate-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-[0_18px_38px_-26px_rgba(15,23,42,0.5)]">
              <div className="flex items-center justify-between px-5 pt-5 pb-3 gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Suwak funkcji
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrevFeature} className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-100 flex items-center justify-center hover:shadow">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={handleNextFeature} className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-100 flex items-center justify-center hover:shadow">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(-${featureIndex * 100}%)` }}
                >
                  {features.map((feature, idx) => (
                    <div key={feature.title} className="min-w-full px-5 pb-6">
                      <div
                        className={`rounded-3xl border h-full border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.55)] transition-all duration-500 ${
                          idx === featureIndex ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-300">
                            {feature.icon}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pb-5">
                {features.map((feature, idx) => (
                  <button
                    key={feature.title}
                    onClick={() => setFeatureIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${featureIndex === idx ? 'w-8 bg-sky-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
                    aria-label={`Pokaż funkcję ${feature.title}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Moduły</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Jednolity język UI dla całej aplikacji</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">Każda zakładka wykorzystuje te same wzorce: nagłówki z opisem, bloki danych w kartach i akcje w prawym górnym rogu.</p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-300">Zaloguj się →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => (
              <div key={module.title} className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-4 flex flex-col gap-2 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{module.title}</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{module.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-300 mt-auto">Spójny layout</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl">
              <div className="space-y-3 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Start</p>
                <h3 className="text-2xl sm:text-3xl font-bold">Nowy wygląd KadryHR jest gotowy do wdrożenia</h3>
                <p className="text-sm text-blue-100">Login → dashboard → grafik → urlopy → powiadomienia. Wszystko wygląda i działa tak samo, niezależnie od zakładki.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold shadow-lg">
                  Utwórz konto
                </Link>
                <button
                  onClick={handleDemoLogin}
                  disabled={isDemoLoading}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-white/40 text-white font-semibold"
                >
                  {isDemoLoading ? 'Wczytywanie demo...' : 'Sprawdź demo'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
