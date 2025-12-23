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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    const returnUrl = `/qr/start?token=${token}`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Rozpocznij pracę
          </h1>

          {error && (
            <Alert type="error" message={error} className="mb-4" />
          )}

          {success && (
            <Alert type="success" message={success} className="mb-4" />
          )}

          {loading && (
            <div className="py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Rozpoczynanie pracy...
              </p>
            </div>
          )}

          {!loading && !success && tokenInfo && (
            <div className="py-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Pracownik:
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tokenInfo.employee?.firstName} {tokenInfo.employee?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tokenInfo.employee?.position}
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Trwa rozpoczynanie sesji pracy...
              </p>
            </div>
          )}

          {!loading && !success && !tokenInfo && error && (
            <div className="py-4">
              <button
                onClick={() => navigate('/time-tracking')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
