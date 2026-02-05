'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ApiError, apiClient } from '@/lib/api-client';
import { pushToast } from '@/lib/toast';
import type { RcpMapCircle, RcpMapMarker } from '@/components/rcp/rcp-map';

const RcpMap = dynamic(() => import('@/components/rcp/rcp-map'), { ssr: false });

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface RcpStatus {
  isClockedIn: boolean;
  lastPunchAt: string | null;
  lastEventType: 'CLOCK_IN' | 'CLOCK_OUT' | null;
}

interface RcpEvent {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  happenedAt: string;
  locationName: string;
  distanceMeters: number;
}

interface RcpLocation {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  radiusMeters: number | null;
}

interface MobileRcpSession {
  organization: {
    id: string;
    name: string;
  };
  location: RcpLocation;
  rcpStatus: RcpStatus;
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
  const [session, setSession] = useState<MobileRcpSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [lastPunch, setLastPunch] = useState<{
    lat: number;
    lng: number;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    happenedAt: string;
  } | null>(null);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    distance?: number;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiClient.request('/auth/me', { auth: true });
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

  const fetchSession = useCallback(async () => {
    if (!token) {
      return;
    }
    setSessionLoading(true);
    setSessionError(null);
    try {
      const response = await apiClient.request<MobileRcpSession>(
        '/rcp/mobile/session',
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ token }),
          suppressToast: true,
        },
      );
      setSession(response);
      setStatus(response.rcpStatus);
    } catch (error: unknown) {
      let errorMessage = 'Nie udało się zweryfikować tokenu RCP.';
      let code: string | undefined;
      let backendMessage: string | undefined;

      if (error instanceof ApiError) {
        const data =
          typeof error.data === 'object' && error.data !== null
            ? (error.data as Record<string, unknown>)
            : undefined;
        if (data) {
          if (typeof data.code === 'string') {
            code = data.code;
          }

          const messagePayload = data.message;
          if (typeof messagePayload === 'string') {
            backendMessage = messagePayload;
          } else if (typeof messagePayload === 'object' && messagePayload !== null) {
            const nested = messagePayload as Record<string, unknown>;
            if (typeof nested.code === 'string') {
              code = nested.code;
            }
            if (typeof nested.message === 'string') {
              backendMessage = nested.message;
            }
          }
        }
        if (!backendMessage && error.message) {
          backendMessage = error.message;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        backendMessage = String((error as { message?: string }).message ?? '');
      }

      if (code === 'rcp_token_invalid' || code === 'rcp_token_expired') {
        errorMessage = 'Link wygasł lub jest nieprawidłowy.';
      } else if (code === 'rcp_access_denied') {
        errorMessage = 'Brak dostępu do tej lokalizacji RCP.';
      } else if (backendMessage) {
        if (backendMessage.toLowerCase().includes('expired')) {
          errorMessage = 'Link wygasł lub jest nieprawidłowy.';
        } else if (backendMessage.toLowerCase().includes('invalid')) {
          errorMessage = 'Link wygasł lub jest nieprawidłowy.';
        } else {
          errorMessage = backendMessage;
        }
      }
      setSessionError(errorMessage);
      setSession(null);
      setStatus(null);
    } finally {
      setSessionLoading(false);
    }
  }, [token]);

  const fetchHistory = useCallback(async (locationId: string) => {
    setHistoryLoading(true);
    try {
      const response = await apiClient.request<{
        items: RcpEvent[];
      }>(`/rcp/events/me?take=10&locationId=${locationId}`, {
        auth: true,
        suppressToast: true,
      });
      setHistory(response.items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch status
  useEffect(() => {
    if (isAuthenticated) {
      fetchSession();
    }
  }, [isAuthenticated, fetchSession]);

  useEffect(() => {
    if (session?.location.id) {
      fetchHistory(session.location.id);
    }
  }, [session?.location.id, fetchHistory]);

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

    if (!session?.location.id) {
      pushToast('Brak lokalizacji z tokenu QR', 'error');
      return;
    }

    if (geoState.lat === null || geoState.lng === null) {
      pushToast('Najpierw pobierz swoją lokalizację', 'warning');
      return;
    }

    setClockLoading(true);
    setLastResult(null);

    try {
      const response = await apiClient.request<{
        ok: boolean;
        distanceMeters: number;
        happenedAt: string;
        locationName: string;
        type: string;
      }>('/rcp/clock', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          token,
          type,
          clientLat: geoState.lat,
          clientLng: geoState.lng,
          accuracyMeters: geoState.accuracy || undefined,
          clientTime: new Date().toISOString(),
        }),
        suppressToast: true,
      });

      const actionText = type === 'CLOCK_IN' ? 'Wejście' : 'Wyjście';
      setLastResult({
        success: true,
        message: `${actionText} zarejestrowane pomyślnie!`,
        distance: response.distanceMeters,
      });
      if (geoState.lat !== null && geoState.lng !== null) {
        setLastPunch({
          lat: geoState.lat,
          lng: geoState.lng,
          type,
          happenedAt: response.happenedAt,
        });
      }
      pushToast(`${actionText} zarejestrowane (${response.distanceMeters}m)`, 'success');
      
      // Refresh status
      await fetchSession();
      if (session?.location.id) {
        await fetchHistory(session.location.id);
      }
    } catch (error: unknown) {
      let errorMessage = 'Nie udało się zarejestrować czasu pracy';
      let code: string | undefined;
      let backendMessage: string | undefined;

      if (error instanceof ApiError) {
        const data =
          typeof error.data === 'object' && error.data !== null
            ? (error.data as Record<string, unknown>)
            : undefined;
        if (data) {
          if (typeof data.code === 'string') {
            code = data.code;
          }

          const messagePayload = data.message;
          if (typeof messagePayload === 'string') {
            backendMessage = messagePayload;
          } else if (typeof messagePayload === 'object' && messagePayload !== null) {
            const nested = messagePayload as Record<string, unknown>;
            if (typeof nested.code === 'string') {
              code = nested.code;
            }
            if (typeof nested.message === 'string') {
              backendMessage = nested.message;
            }
          }
        }
        if (!backendMessage && error.message) {
          backendMessage = error.message;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        backendMessage = String((error as { message?: string }).message ?? '');
      }

      if (code === 'RCP_OUTSIDE_GEOFENCE') {
        errorMessage = 'Znajdujesz się poza obszarem lokalizacji';
      } else if (code === 'RCP_TOKEN_EXPIRED') {
        errorMessage = 'Token wygasł. Poproś kierownika o nowy kod QR';
      } else if (code === 'RCP_LOW_ACCURACY') {
        errorMessage = 'Dokładność lokalizacji jest zbyt niska. Spróbuj ponownie na zewnątrz.';
      } else if (code === 'RCP_ALREADY_CLOCKED_IN') {
        errorMessage = 'Jesteś już zalogowany. Najpierw zarejestruj wyjście.';
      } else if (code === 'RCP_ALREADY_CLOCKED_OUT') {
        errorMessage = 'Jesteś już wylogowany. Najpierw zarejestruj wejście.';
      } else if (code === 'RCP_RATE_LIMIT') {
        errorMessage = 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.';
      } else if (backendMessage) {
        errorMessage = backendMessage;
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

  const mapCenter = useMemo(() => {
    if (geoState.lat !== null && geoState.lng !== null) {
      return { lat: geoState.lat, lng: geoState.lng };
    }
    const location = session?.location;
    if (location?.lat != null && location?.lng != null) {
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }
    return { lat: 52.2297, lng: 21.0122 };
  }, [geoState.lat, geoState.lng, session?.location]);

  const mapMarkers: RcpMapMarker[] = useMemo(() => {
    const markers: RcpMapMarker[] = [];

    if (session?.location?.lat != null && session?.location?.lng != null) {
      markers.push({
        id: `location-${session.location.id}`,
        position: {
          lat: session.location.lat as number,
          lng: session.location.lng as number,
        },
        label: 'L',
        title: session.location.name,
      });
    }

    if (geoState.lat !== null && geoState.lng !== null) {
      markers.push({
        id: 'current-location',
        position: { lat: geoState.lat, lng: geoState.lng },
        label: 'Ty',
        title: 'Twoja lokalizacja',
      });
    }

    if (lastPunch) {
      markers.push({
        id: 'last-punch',
        position: { lat: lastPunch.lat, lng: lastPunch.lng },
        label: lastPunch.type === 'CLOCK_IN' ? 'IN' : 'OUT',
        title: `Ostatnie ${lastPunch.type === 'CLOCK_IN' ? 'wejście' : 'wyjście'}`,
      });
    }

    return markers;
  }, [geoState.lat, geoState.lng, lastPunch, session?.location]);

  const mapCircles: RcpMapCircle[] = useMemo(
    () =>
      session?.location?.lat != null &&
      session?.location?.lng != null &&
      session?.location?.radiusMeters
        ? [
            {
              id: `circle-${session.location.id}`,
              center: {
                lat: session.location.lat as number,
                lng: session.location.lng as number,
              },
              radiusMeters: session.location.radiusMeters as number,
            },
          ]
        : [],
    [
      session?.location.id,
      session?.location.lat,
      session?.location.lng,
      session?.location.radiusMeters,
    ],
  );

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

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center text-white">Ładowanie danych RCP...</div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Link wygasł lub jest nieprawidłowy
            </h1>
            <p className="text-gray-400 mb-4">{sessionError}</p>
            <p className="text-gray-500 text-sm">
              Zeskanuj kod QR ponownie lub skontaktuj się z managerem.
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

        {session && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Organizacja
            </div>
            <div className="text-white font-semibold">
              {session.organization.name}
            </div>
            <div className="text-xs uppercase tracking-wide text-gray-500 pt-2">
              Lokalizacja
            </div>
            <div className="text-white font-semibold">
              {session.location.name}
            </div>
            {session.location.address && (
              <div className="text-xs text-gray-400">
                {session.location.address}
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {status && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Twój status:</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">
                  {status.isClockedIn ? '🟢 Zalogowany' : '🔴 Wylogowany'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {status.lastEventType
                    ? status.lastEventType === 'CLOCK_IN'
                      ? 'Ostatnie wejście'
                      : 'Ostatnie wyjście'
                    : 'Brak zdarzeń'}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {status.lastPunchAt
                  ? new Date(status.lastPunchAt).toLocaleString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })
                  : '--'}
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

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
            <div className="text-sm font-medium text-white">🗺️ Mapa RCP</div>
            {geoState.error && (
              <div className="text-xs text-red-300">
                Brak dostępu do lokalizacji – mapa pokazuje lokalizację z kodu QR.
              </div>
            )}
            {!geoState.lat &&
              (!session?.location.lat || !session?.location.lng) && (
                <div className="text-xs text-gray-400">
                  Brak współrzędnych lokalizacji – mapa pokazuje domyślną lokalizację
                  (Warszawa).
                </div>
              )}
            <div className="w-full overflow-hidden rounded-lg border border-gray-700">
              <RcpMap
                center={mapCenter}
                zoom={15}
                markers={mapMarkers}
                circles={mapCircles}
                heightPx={240}
                className="h-[240px]"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span>• L = lokalizacja firmy</span>
              <span>• Ty = bieżąca pozycja</span>
              {lastPunch && (
                <span>
                  • {lastPunch.type === 'CLOCK_IN' ? 'IN' : 'OUT'} = ostatnie
                  zdarzenie
                </span>
              )}
            </div>
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
              onClick={() => session?.location.id && fetchHistory(session.location.id)}
              disabled={historyLoading || !session?.location.id}
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
