import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FloatingParticles from '../components/FloatingParticles';
import ThemeSwitcher from '../components/ThemeSwitcher';

const Landing = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll reveal animation with bidirectional behavior
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        } else {
          entry.target.classList.remove('revealed');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const { data } = await api.post('/auth/demo');
      
      // Zapisz token i dane użytkownika
      if (data.token) {
        localStorage.setItem('kadryhr_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('kadryhr_user', JSON.stringify(data.user));
      }
      
      login(data.user);
      navigate('/app');
    } catch (error) {
      console.error('Demo login error:', error);
      const errorMessage = error.response?.data?.message || 'Nie udało się zalogować do wersji demo. Spróbuj ponownie.';
      alert(errorMessage);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const features = [
    {
      title: 'Zarządzanie grafikami',
      description: 'Twórz miesięczne grafiki pracy, zarządzaj zmianami i unikaj kolizji w harmonogramie.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Urlopy i zwolnienia',
      description: 'Pracownicy składają wnioski online, a Ty zatwierdzasz je z poziomu panelu administracyjnego.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Kalkulator wynagrodzeń',
      description: 'Obliczaj wynagrodzenia brutto/netto, składki ZUS i podatki w prosty i przejrzysty sposób.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Zamiany zmian',
      description: 'Pracownicy mogą proponować zamiany zmian, które wymagają Twojej akceptacji.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      title: 'Raporty i statystyki',
      description: 'Generuj szczegółowe raporty dotyczące czasu pracy, urlopów i wynagrodzeń.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Sugestie zespołu',
      description: 'Zbieraj pomysły i feedback od pracowników w jednym centralnym miejscu.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  const benefits = [
    {
      title: 'Bezpieczne logowanie',
      description: 'Autoryzacja JWT z tokenami w cookies i nagłówkach Bearer dla maksymalnego bezpieczeństwa.',
    },
    {
      title: 'Gotowe do wdrożenia',
      description: 'Zbudowane na Node.js 20 i React, gotowe do uruchomienia z PM2 i Nginx.',
    },
    {
      title: 'Responsywny design',
      description: 'Działa płynnie na komputerach, tabletach i smartfonach.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-700 dark:text-slate-200 transition-colors duration-500">
      {/* Theme Switcher */}
      <ThemeSwitcher />
      
      {/* Enhanced Floating Particles with Collision Physics */}
      <FloatingParticles count={15} minSize={60} maxSize={200} speed={0.8} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/60 dark:border-slate-800/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="h-10 w-10 rounded-2xl bg-theme-gradient flex items-center justify-center shadow-lg shadow-theme group-hover:shadow-pink-500/60 transition-smooth group-hover:scale-110">
                <span className="text-sm font-bold text-white">KH</span>
              </div>
              <div>
                <div className="text-lg font-bold gradient-text text-slate-800 dark:text-slate-100">
                  KadryHR
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Nowoczesny system HR</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center rounded-full border-2 border-theme-light px-5 py-2 text-sm font-semibold text-theme-primary hover:bg-theme-very-light transition-smooth hover-lift dark:text-slate-100 dark:border-slate-700/70 dark:hover:bg-slate-800"
              >
                Zaloguj się
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-full bg-theme-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 transition-smooth hover-lift btn-ripple dark:shadow-pink-500/20"
              >
                Rozpocznij
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden py-20 sm:py-32">
        <div 
          className="absolute inset-0 bg-gradient-radial from-pink-100/45 via-transparent to-transparent dark:from-slate-900/80 dark:via-transparent dark:to-transparent animate-gradient"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 px-4 py-2 text-sm font-semibold text-theme-primary border border-theme-light shadow-sm animate-fade-in hover-lift dark:from-slate-900 dark:to-slate-800 dark:text-slate-100 dark:border-slate-700/70">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-very-light0"></span>
              </span>
              Kompleksowe rozwiązanie HR dla Twojej firmy
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 leading-tight animate-slide-up">
              Zarządzaj zespołem
              <br />
              <span className="gradient-text">
                z łatwością i elegancją
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              KadryHR to nowoczesna platforma do zarządzania pracownikami, grafikami, urlopami i wynagrodzeniami. 
              Wszystko w jednym miejscu, dostępne z każdego urządzenia.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-theme-gradient px-8 py-4 text-base font-semibold text-white shadow-xl shadow-theme hover:shadow-2xl hover:shadow-pink-500/40 transition-smooth hover-lift btn-ripple animate-glow"
              >
                Utwórz konto za darmo
                <svg className="w-5 h-5 animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="inline-flex items-center gap-2 rounded-full border-2 border-theme-light bg-white px-8 py-4 text-base font-semibold text-theme-primary hover:bg-theme-very-light transition-smooth hover-lift disabled:opacity-50 disabled:cursor-not-allowed btn-ripple dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {isDemoLoading ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    Ładowanie...
                  </>
                ) : (
                  <>
                    Zobacz demo
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Bez karty kredytowej</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gotowe w 5 minut</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative bg-white/50 dark:bg-slate-950/60 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Kompleksowe narzędzia do zarządzania zasobami ludzkimi w Twojej organizacji
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-white/90 dark:bg-slate-900/80 rounded-2xl p-8 shadow-lg shadow-theme/15 dark:shadow-black/30 border border-white/60 dark:border-slate-800/60 hover:shadow-2xl hover:shadow-theme transition-smooth hover-lift card-3d scroll-reveal stagger-${(index % 6) + 1}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-900/70 dark:to-slate-800/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-smooth"></div>
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-theme-gradient text-white shadow-lg shadow-theme mb-6 group-hover:scale-110 transition-smooth animate-float">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br bg-theme-gradient dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-3xl shadow-2xl shadow-theme/40 dark:shadow-black/50 overflow-hidden animate-gradient">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-12 lg:p-16">
              <div className="space-y-6 text-white">
                <h2 className="text-3xl sm:text-4xl font-bold animate-slide-up">
                  Dlaczego KadryHR?
                </h2>
                <p className="text-lg text-pink-100 leading-relaxed dark:text-slate-200">
                  Stworzyliśmy platformę, która łączy prostotę użytkowania z zaawansowanymi funkcjami. 
                  Twój zespół pokocha KadryHR.
                </p>
                <div className="space-y-4 pt-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4 animate-slide-in-left" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 dark:bg-slate-700/40 flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1 text-white dark:text-slate-100">{benefit.title}</h3>
                        <p className="text-pink-100 dark:text-slate-300">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-md animate-float-slow">
                  <div className="absolute inset-0 bg-white/10 dark:bg-slate-900/50 rounded-3xl backdrop-blur-xl"></div>
                  <div className="relative glass-strong rounded-3xl p-8 border border-white/30 dark:border-slate-700/60">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm">Token JWT</span>
                        <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold animate-pulse-slow">Aktywny</span>
                      </div>
                      <div className="h-px bg-white/20"></div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                          <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-slate-800/40 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-sm dark:text-slate-100">Bezpieczne połączenie</div>
                            <div className="text-white/60 text-xs dark:text-slate-300">HTTPS + JWT</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
                          <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-slate-800/40 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-sm dark:text-slate-100">Szybkie działanie</div>
                            <div className="text-white/60 text-xs dark:text-slate-300">Node.js 20 + React</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
                          <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-slate-800/40 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-sm dark:text-slate-100">Zgodność z RODO</div>
                            <div className="text-white/60 text-xs dark:text-slate-300">Pełna ochrona danych</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Gotowy na zmianę?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Dołącz do firm, które zaufały KadryHR i uprość zarządzanie swoim zespołem już dziś.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-theme-gradient px-8 py-4 text-base font-semibold text-white shadow-xl shadow-theme hover:shadow-2xl hover:shadow-pink-500/40 transition-smooth hover-lift btn-ripple dark:shadow-pink-500/20"
            >
              Rozpocznij za darmo
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button
              onClick={handleDemoLogin}
              disabled={isDemoLoading}
              className="inline-flex items-center gap-2 rounded-full border-2 border-theme-light bg-white px-8 py-4 text-base font-semibold text-theme-primary hover:bg-theme-very-light transition-smooth hover-lift disabled:opacity-50 disabled:cursor-not-allowed btn-ripple dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {isDemoLoading ? 'Ładowanie...' : 'Wypróbuj demo'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/60 dark:border-slate-800/70 bg-white/60 dark:bg-slate-950/70 backdrop-blur-xl py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-slate-600 dark:text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-theme-gradient flex items-center justify-center shadow-lg shadow-theme">
                  <span className="text-sm font-bold text-white">KH</span>
                </div>
                <div>
                  <div className="text-lg font-bold gradient-text text-slate-800 dark:text-slate-100">
                    KadryHR
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Nowoczesne rozwiązanie HR dla Twojej firmy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Funkcje</Link></li>
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Cennik</Link></li>
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Firma</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">O nas</Link></li>
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Kontakt</Link></li>
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Wsparcie</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Dokumentacja</Link></li>
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Pomoc</Link></li>
                <li><Link to="/login" className="hover:text-theme-primary transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/60 dark:border-slate-800/70 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2025 KadryHR. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
