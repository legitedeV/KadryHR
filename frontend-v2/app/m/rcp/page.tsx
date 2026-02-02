'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { pushToast } from '@/lib/toast';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface RcpStatus {
  lastEvent: {
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    happenedAt: string;
    locationName: string;
  } | null;
  isClockedIn: boolean;
}

interface RcpEvent {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  happenedAt: string;
  locationName: string;
  distanceMeters: number;
}

function MobileRcpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [geoState, setGeoState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: false,
  });
  const [status, setStatus] = useState<RcpStatus | null>(null);
  const [history, setHistory] = useState<RcpEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    distance?: number;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiClient.get('/auth/me', { auth: true });
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        // Redirect to login with return URL
        const returnUrl = `/m/rcp${token ? `?token=${token}` : ''}`;
        router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
      }
    };

    checkAuth();
  }, [router, token]);

  // Fetch status
  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchStatus = async () => {
    try {
      const response = await apiClient.get<RcpStatus>('/rcp/status', {
        auth: true,
      });
      setStatus(response);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await apiClient.get<{
        items: RcpEvent[];
      }>('/rcp/events/me?take=10', { auth: true });
      setHistory(response.items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState((prev) => ({
        ...prev,
        error: 'Geolokalizacja nie jest wspierana przez Twoją przeglądarkę',
      }));
      return;
    }

    setGeoState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
        setLastResult(null);
      },
      (error) => {
        let errorMessage = 'Nie udało się pobrać lokalizacji';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Brak dostępu do lokalizacji. Sprawdź uprawnienia w przeglądarce.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Lokalizacja niedostępna. Sprawdź czy GPS jest włączony.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Przekroczono czas oczekiwania na lokalizację';
        }
        setGeoState({
          lat: null,
          lng: null,
          accuracy: null,
          error: errorMessage,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  const handleClock = async (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!token) {
      pushToast('Brak tokenu QR', 'error');
      return;
    }

    if (geoState.lat === null || geoState.lng === null) {
      pushToast('Najpierw pobierz swoją lokalizację', 'warning');
      return;
    }

    setClockLoading(true);
    setLastResult(null);

    try {
      const response = await apiClient.post<{
        ok: boolean;
        distanceMeters: number;
        happenedAt: string;
        locationName: string;
        type: string;
      }>(
        '/rcp/clock',
        {
          token,
          type,
          clientLat: geoState.lat,
          clientLng: geoState.lng,
          accuracyMeters: geoState.accuracy || undefined,
          clientTime: new Date().toISOString(),
        },
        { auth: true },
      );

      const actionText = type === 'CLOCK_IN' ? 'Wejście' : 'Wyjście';
      setLastResult({
        success: true,
        message: `${actionText} zarejestrowane pomyślnie!`,
        distance: response.distanceMeters,
      });
      pushToast(`${actionText} zarejestrowane (${response.distanceMeters}m)`, 'success');
      
      // Refresh status
      await fetchStatus();
      await fetchHistory();
    } catch (error: unknown) {
      let errorMessage = 'Nie udało się zarejestrować czasu pracy';

      const err = error as { message?: string };
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.code) {
            if (parsed.code === 'RCP_OUTSIDE_GEOFENCE') {
              errorMessage = parsed.message || 'Znajdujesz się poza obszarem lokalizacji';
            } else if (parsed.code === 'RCP_TOKEN_EXPIRED') {
              errorMessage = 'Token wygasł. Poproś kierownika o nowy kod QR';
            } else if (parsed.code === 'RCP_LOW_ACCURACY') {
              errorMessage = 'Dokładność lokalizacji jest zbyt niska. Spróbuj ponownie na zewnątrz.';
            } else if (parsed.code === 'RCP_ALREADY_CLOCKED_IN') {
              errorMessage = 'Jesteś już zalogowany. Najpierw zarejestruj wyjście.';
            } else if (parsed.code === 'RCP_ALREADY_CLOCKED_OUT') {
              errorMessage = 'Jesteś już wylogowany. Najpierw zarejestruj wejście.';
            } else if (parsed.code === 'RCP_RATE_LIMIT') {
              errorMessage = 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.';
            } else {
              errorMessage = parsed.message || errorMessage;
            }
          }
        } catch {
          errorMessage = err.message || errorMessage;
        }
      }

      setLastResult({
        success: false,
        message: errorMessage,
      });
      pushToast(errorMessage, 'error');
    } finally {
      setClockLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-white">Ładowanie...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Brak tokenu
            </h1>
            <p className="text-gray-400">
              Zeskanuj kod QR udostępniony przez kierownika
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">
            Rejestracja czasu pracy
          </h1>
          <p className="text-gray-400 text-sm">
            Zarejestruj swoje wejście lub wyjście z pracy
          </p>
        </div>

        {/* Status */}
        {status && status.lastEvent && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Twój status:</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">
                  {status.isClockedIn ? '🟢 Zalogowany' : '🔴 Wylogowany'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {status.lastEvent.locationName}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(status.lastEvent.happenedAt).toLocaleString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </div>
            </div>
          </div>
        )}

        {/* Location Section */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-sm font-medium text-white mb-3">
              📍 Twoja lokalizacja
            </div>

            {!geoState.lat && !geoState.error && (
              <button
                onClick={requestLocation}
                disabled={geoState.loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {geoState.loading ? 'Pobieranie...' : 'Pobierz lokalizację'}
              </button>
            )}

            {geoState.error && (
              <div className="space-y-3">
                <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                  {geoState.error}
                </div>
                <button
                  onClick={requestLocation}
                  disabled={geoState.loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Spróbuj ponownie
                </button>
              </div>
            )}

            {geoState.lat && geoState.lng && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Szerokość:</span>
                  <span className="text-white font-mono">
                    {geoState.lat.toFixed(6)}°
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Długość:</span>
                  <span className="text-white font-mono">
                    {geoState.lng.toFixed(6)}°
                  </span>
                </div>
                {geoState.accuracy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Dokładność:</span>
                    <span
                      className={`font-medium ${
                        geoState.accuracy <= 50
                          ? 'text-green-400'
                          : geoState.accuracy <= 100
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      ±{Math.round(geoState.accuracy)}m
                    </span>
                  </div>
                )}
                <button
                  onClick={requestLocation}
                  disabled={geoState.loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-lg transition-colors mt-2"
                >
                  Odśwież lokalizację
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {geoState.lat && geoState.lng && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleClock('CLOCK_IN')}
                disabled={clockLoading || (status?.isClockedIn ?? false)}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
              >
                Wejście ▶
              </button>
              <button
                onClick={() => handleClock('CLOCK_OUT')}
                disabled={clockLoading || !(status?.isClockedIn ?? true)}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
              >
                Wyjście ⏹
              </button>
            </div>
          )}

          {/* Result */}
          {lastResult && (
            <div
              className={`rounded-xl p-4 border ${
                lastResult.success
                  ? 'bg-green-950/30 border-green-900/50 text-green-300'
                  : 'bg-red-950/30 border-red-900/50 text-red-300'
              }`}
            >
              <div className="font-medium mb-1">{lastResult.message}</div>
              {lastResult.distance !== undefined && (
                <div className="text-sm opacity-75">
                  Odległość od lokalizacji: {lastResult.distance}m
                </div>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white">Ostatnie zdarzenia</div>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={historyLoading}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500"
            >
              {historyLoading ? 'Odświeżanie...' : 'Odśwież'}
            </button>
          </div>

          {historyLoading && history.length === 0 && (
            <div className="text-sm text-gray-400">Ładowanie historii...</div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="text-sm text-gray-400">Brak zapisanych zdarzeń.</div>
          )}

          {history.length > 0 && (
            <div className="space-y-3">
              {history.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="text-white font-medium">
                      {event.type === 'CLOCK_IN' ? 'Wejście' : 'Wyjście'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.locationName} • {event.distanceMeters}m
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(event.happenedAt).toLocaleString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-800">
          Rejestracja czasu pracy • KadryHR
        </div>
      </div>
    </div>
  );
}

export default function MobileRcpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
          <div className="text-white">Ładowanie...</div>
        </div>
      }
    >
      <MobileRcpContent />
    </Suspense>
  );
}
