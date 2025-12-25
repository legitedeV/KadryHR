import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Alert from '../components/Alert';

const QRStart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const processedRef = useRef(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Brak tokenu w URL');
      return;
    }

    // Verify token first
    verifyToken();
  }, [token]);

  useEffect(() => {
    // If user is logged in and token is valid, start the session
    if (user && tokenInfo && !processedRef.current) {
      processedRef.current = true;
      startSession();
    }
  }, [user, tokenInfo]);

  const verifyToken = async () => {
    try {
      const response = await api.post('/qr/verify-token', { token });
      if (response.data.valid) {
        setTokenInfo(response.data);
      } else {
        setError(response.data.message || 'Token jest nieprawidłowy');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd weryfikacji tokenu');
    }
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get geolocation if available
      let latitude = null;
      let longitude = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoError) {
          console.warn('Geolocation not available:', geoError);
        }
      }

      const response = await api.post('/qr/start-by-token', {
        token,
        latitude,
        longitude,
        notes: 'Rozpoczęcie pracy przez QR kod'
      });

      setSuccess('Praca rozpoczęta pomyślnie!');
      
      // Redirect to time tracking page after 2 seconds
      setTimeout(() => {
        navigate('/time-tracking');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd podczas rozpoczynania pracy');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-loading">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    // Redirect to login with return URL
    const returnUrl = `/qr/start?token=${token}`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-layout relative overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 12% 18%, rgba(var(--theme-primary-rgb),0.18), transparent 32%),
          radial-gradient(circle at 84% 8%, rgba(14,165,233,0.16), transparent 36%),
          radial-gradient(circle at 50% 88%, rgba(37,99,235,0.14), transparent 40%)`
        }}
      />

      <div className="w-full max-w-xl relative z-10">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full px-4 py-2 border border-white/60 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl shadow-[0_18px_60px_-36px_rgba(15,23,42,0.55)]">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>
            KH
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">KadryHR • Rejestrowanie czasu</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Start sesji pracy</p>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 rounded-3xl shadow-[0_24px_70px_-36px_rgba(15,23,42,0.7)] backdrop-blur-2xl p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sesja QR</p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rozpocznij pracę</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Potwierdź token z QR, a my automatycznie rozpoczniemy sesję oraz zapiszemy kontekst.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-theme-very-light text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/70">
              Błyskawicznie
            </span>
          </div>

          {error && (
            <Alert type="error" message={error} />
          )}

          {success && (
            <Alert type="success" message={success} />
          )}

          {loading && (
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-theme-very-light/60 dark:bg-slate-800/50 p-6 text-center space-y-3">
              <div className="spinner h-10 w-10 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-300">Rozpoczynanie pracy...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Łączymy dane geolokalizacji oraz zapisujemy start.</p>
            </div>
          )}

          {!loading && !success && tokenInfo && (
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-theme-very-light/60 dark:bg-slate-800/50 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pracownik</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tokenInfo.employee?.firstName} {tokenInfo.employee?.lastName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{tokenInfo.employee?.position || 'Stanowisko nieznane'}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-200">
                  Token zweryfikowany
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Trwa rozpoczynanie sesji pracy...</p>
            </div>
          )}

          {!loading && !success && !tokenInfo && error && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">Nie udało się potwierdzić tokenu. Wróć do głównego panelu rejestracji czasu, aby spróbować ponownie.</p>
              <button
                onClick={() => navigate('/time-tracking')}
                className="w-full rounded-xl bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 text-white text-sm font-semibold py-3 shadow-lg shadow-slate-900/30 hover:translate-y-[-1px] transition-all duration-200"
              >
                Powrót do śledzenia czasu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRStart;
