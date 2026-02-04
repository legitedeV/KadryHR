'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { pushToast } from '@/lib/toast';
import { useAuth } from '@/lib/auth-context';
import {
  apiGetOrganisationLocations,
  apiGetOrganisationMembers,
  apiUpdateOrganisationLocation,
  OrganisationMember,
} from '@/lib/api';
import QRCode from 'qrcode';
import type { RcpMapCircle, RcpMapMarker } from '@/components/rcp/rcp-map';

const RcpMap = dynamic(() => import('@/components/rcp/rcp-map'), { ssr: false });

interface Location {
  id: string;
  name: string;
  address?: string;
  addressStreet?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressCountry?: string;
  geoLat?: number;
  geoLng?: number;
  geoRadiusMeters?: number;
  rcpEnabled: boolean;
  rcpAccuracyMaxMeters: number;
}

interface QrResult {
  qrUrl: string;
  tokenExpiresAt: string;
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
  locationId: string;
  locationName: string;
  distanceMeters: number;
  accuracyMeters: number | null;
  clientLat?: number | null;
  clientLng?: number | null;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface GeocodeResponse {
  formattedAddress: string | null;
  street: string | null;
  streetNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export default function PanelRcpPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [geoState, setGeoState] = useState<{
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    error: string | null;
    loading: boolean;
  }>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: false,
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrResult, setQrResult] = useState<QrResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [status, setStatus] = useState<RcpStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockResult, setClockResult] = useState<{
    success: boolean;
    message: string;
    distance?: number;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [events, setEvents] = useState<RcpEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventFilters, setEventFilters] = useState({
    userId: '',
    locationId: '',
    type: '',
    from: '',
    to: '',
  });
  const [eventPagination, setEventPagination] = useState({
    skip: 0,
    take: 25,
    total: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // RBAC Guard - tylko Manager/Owner/Admin
  const hasRcpAccess = user?.permissions?.includes('RCP_EDIT') || 
                       ['MANAGER', 'OWNER', 'ADMIN'].includes(user?.role || '');

  useEffect(() => {
    if (!hasRcpAccess) {
      // Redirect jeśli nie ma uprawnień
      router.replace('/panel/dashboard');
    } else {
      fetchLocations();
      fetchMembers();
      fetchEvents(0);
    }
  }, [hasRcpAccess, router]);

  const fetchMembers = async () => {
    try {
      const response = await apiGetOrganisationMembers();
      setMembers(response.filter((member) => member.status === 'ACTIVE'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać pracowników';
      pushToast(errorMessage, 'error');
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await apiGetOrganisationLocations();
      const mappedLocations = response.map((location) => {
        const addressParts = [
          location.addressStreet,
          location.addressPostalCode,
          location.addressCity,
          location.addressCountry,
        ]
          .filter(Boolean)
          .join(', ');
        const geoLat =
          typeof location.geoLat === 'string'
            ? Number(location.geoLat)
            : location.geoLat;
        const geoLng =
          typeof location.geoLng === 'string'
            ? Number(location.geoLng)
            : location.geoLng;
        const geoRadiusMeters =
          typeof location.geoRadiusMeters === 'string'
            ? Number(location.geoRadiusMeters)
            : location.geoRadiusMeters;
        const rcpAccuracyMaxMeters =
          typeof location.rcpAccuracyMaxMeters === 'string'
            ? Number(location.rcpAccuracyMaxMeters)
            : location.rcpAccuracyMaxMeters;
        return {
          id: location.id,
          name: location.name,
          address: location.address ?? (addressParts || undefined),
          addressStreet: location.addressStreet ?? undefined,
          addressPostalCode: location.addressPostalCode ?? undefined,
          addressCity: location.addressCity ?? undefined,
          addressCountry: location.addressCountry ?? undefined,
          geoLat,
          geoLng,
          geoRadiusMeters,
          rcpEnabled: location.rcpEnabled ?? false,
          rcpAccuracyMaxMeters: rcpAccuracyMaxMeters ?? 100,
        } as Location;
      });
      setLocations(mappedLocations);
      if (mappedLocations.length > 0) {
        setSelectedLocation(mappedLocations[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać lokalizacji';
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const buildEventsQuery = (skip: number) => {
    const params = new URLSearchParams();
    params.set('take', String(eventPagination.take));
    params.set('skip', String(skip));

    if (eventFilters.userId) {
      params.set('userId', eventFilters.userId);
    }
    if (eventFilters.locationId) {
      params.set('locationId', eventFilters.locationId);
    }
    if (eventFilters.type) {
      params.set('type', eventFilters.type);
    }
    if (eventFilters.from) {
      params.set(
        'from',
        new Date(`${eventFilters.from}T00:00:00`).toISOString(),
      );
    }
    if (eventFilters.to) {
      params.set(
        'to',
        new Date(`${eventFilters.to}T23:59:59.999`).toISOString(),
      );
    }

    return params.toString();
  };

  const fetchEvents = async (skip: number) => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const response = await apiClient.request<{
        items: RcpEvent[];
        total: number;
        skip: number;
        take: number;
      }>(`/rcp/events?${buildEventsQuery(skip)}`, { auth: true });
      setEvents(response.items);
      setEventPagination((prev) => ({
        ...prev,
        skip: response.skip,
        take: response.take,
        total: response.total,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać zdarzeń RCP';
      setEventsError(errorMessage);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchStatus = async (locationId?: string) => {
    setStatusLoading(true);
    try {
      const query = locationId ? `?locationId=${locationId}` : '';
      const response = await apiClient.request<RcpStatus>(`/rcp/status${query}`, {
        auth: true,
      });
      setStatus(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać statusu RCP';
      pushToast(errorMessage, 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const extractToken = (qrUrl: string | null) => {
    if (!qrUrl) return null;
    try {
      const parsed = new URL(qrUrl);
      return parsed.searchParams.get('token');
    } catch {
      return null;
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
    if (!qrToken) {
      pushToast('Najpierw wygeneruj kod QR, aby pozyskać token.', 'warning');
      return;
    }
    if (geoState.lat === null || geoState.lng === null) {
      pushToast('Najpierw pobierz lokalizację.', 'warning');
      return;
    }

    setClockLoading(true);
    setClockResult(null);

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
          token: qrToken,
          type,
          clientLat: geoState.lat,
          clientLng: geoState.lng,
          accuracyMeters: geoState.accuracy || undefined,
          clientTime: new Date().toISOString(),
        }),
      });

      const actionText = type === 'CLOCK_IN' ? 'Wejście' : 'Wyjście';
      setClockResult({
        success: true,
        message: `${actionText} zarejestrowane pomyślnie!`,
        distance: response.distanceMeters,
      });
      pushToast(`${actionText} zarejestrowane (${response.distanceMeters}m)`, 'success');

      await fetchStatus(selectedLocation?.id);
      await fetchEvents(0);
    } catch (error: unknown) {
      let errorMessage = 'Nie udało się zarejestrować czasu pracy';
      const err = error as { message?: string };
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorMessage = parsed.message || errorMessage;
        } catch {
          errorMessage = err.message || errorMessage;
        }
      }
      setClockResult({
        success: false,
        message: errorMessage,
      });
      pushToast(errorMessage, 'error');
    } finally {
      setClockLoading(false);
    }
  };

  useEffect(() => {
    if (hasRcpAccess) {
      fetchEvents(0);
    }
  }, [eventFilters, hasRcpAccess]);

  useEffect(() => {
    if (hasRcpAccess) {
      fetchStatus(selectedLocation?.id);
    }
  }, [hasRcpAccess, selectedLocation?.id]);

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEventId(null);
      return;
    }
    if (!selectedEventId || !events.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const generateQr = async () => {
    if (!selectedLocation) {
      pushToast('Wybierz lokalizację', 'warning');
      return;
    }

    if (!selectedLocation.rcpEnabled) {
      pushToast('RCP nie jest włączone dla tej lokalizacji', 'warning');
      return;
    }

    setGenerating(true);
    setQrResult(null);
    setQrDataUrl(null);

    try {
      const result = await apiClient.request<QrResult>('/rcp/qr/generate', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          locationId: selectedLocation.id,
        }),
      });

      setQrResult(result);
      setQrToken(extractToken(result.qrUrl));

      // Generate QR code
      const dataUrl = await QRCode.toDataURL(result.qrUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(dataUrl);

      pushToast('Kod QR wygenerowany pomyślnie', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się wygenerować kodu QR';
      pushToast(errorMessage, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl || !selectedLocation) return;

    const link = document.createElement('a');
    link.download = `rcp-qr-${selectedLocation.name.replace(/\s/g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const printQr = () => {
    if (!qrDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      pushToast('Nie udało się otworzyć okna drukowania', 'error');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kod QR - RCP</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            p {
              margin: 5px 0;
              color: #666;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rejestracja czasu pracy</h1>
            <p>${selectedLocation?.name || ''}</p>
            <p style="font-size: 14px; color: #999;">Zeskanuj kod aby zarejestrować wejście/wyjście</p>
          </div>
          <img src="${qrDataUrl}" alt="QR Code" />
          <div class="footer">
            <p>KadryHR • ${new Date().toLocaleDateString('pl-PL')}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const updateLocationSettings = async (updates: Partial<Location>) => {
    if (!selectedLocation) return;

    try {
      const updated = await apiUpdateOrganisationLocation(
        selectedLocation.id,
        updates,
      );
      const addressParts = [
        updated.addressStreet,
        updated.addressPostalCode,
        updated.addressCity,
        updated.addressCountry,
      ]
        .filter(Boolean)
        .join(', ');
      const nextLocation: Location = {
        id: updated.id,
        name: updated.name,
        address: updated.address ?? (addressParts || undefined),
        addressStreet: updated.addressStreet ?? undefined,
        addressPostalCode: updated.addressPostalCode ?? undefined,
        addressCity: updated.addressCity ?? undefined,
        addressCountry: updated.addressCountry ?? undefined,
        geoLat:
          typeof updated.geoLat === 'string'
            ? Number(updated.geoLat)
            : updated.geoLat,
        geoLng:
          typeof updated.geoLng === 'string'
            ? Number(updated.geoLng)
            : updated.geoLng,
        geoRadiusMeters:
          typeof updated.geoRadiusMeters === 'string'
            ? Number(updated.geoRadiusMeters)
            : updated.geoRadiusMeters,
        rcpEnabled: updated.rcpEnabled ?? false,
        rcpAccuracyMaxMeters:
          typeof updated.rcpAccuracyMaxMeters === 'string'
            ? Number(updated.rcpAccuracyMaxMeters)
            : updated.rcpAccuracyMaxMeters ?? 100,
      };

      setSelectedLocation(nextLocation);
      setLocations(
        locations.map((loc) =>
          loc.id === selectedLocation.id ? nextLocation : loc,
        ),
      );

      pushToast('Ustawienia zaktualizowane', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się zaktualizować ustawień';
      pushToast(errorMessage, 'error');
    }
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;
  const selectedEventLocation = selectedEvent
    ? locations.find((location) => location.id === selectedEvent.locationId) || null
    : null;
  const selectedEventHasCoords =
    selectedEvent?.clientLat !== null &&
    selectedEvent?.clientLng !== null &&
    selectedEvent?.clientLat !== undefined &&
    selectedEvent?.clientLng !== undefined;

  const eventMapCenter = useMemo(() => {
    if (selectedEventHasCoords && selectedEvent) {
      return {
        lat: selectedEvent.clientLat as number,
        lng: selectedEvent.clientLng as number,
      };
    }
    if (
      selectedEventLocation?.geoLat !== undefined &&
      selectedEventLocation.geoLng !== undefined
    ) {
      return {
        lat: selectedEventLocation.geoLat,
        lng: selectedEventLocation.geoLng,
      };
    }
    return { lat: 52.2297, lng: 21.0122 };
  }, [selectedEvent, selectedEventHasCoords, selectedEventLocation]);

  const eventMapMarkers: RcpMapMarker[] = useMemo(() => {
    const markers: RcpMapMarker[] = [];
    if (selectedEventHasCoords && selectedEvent) {
      markers.push({
        id: `event-${selectedEvent.id}`,
        position: {
          lat: selectedEvent.clientLat as number,
          lng: selectedEvent.clientLng as number,
        },
        label: selectedEvent.type === 'CLOCK_IN' ? 'IN' : 'OUT',
        title: `Zdarzenie: ${selectedEvent.type === 'CLOCK_IN' ? 'Wejście' : 'Wyjście'}`,
      });
    }
    if (
      selectedEventLocation?.geoLat !== undefined &&
      selectedEventLocation.geoLng !== undefined
    ) {
      markers.push({
        id: `location-${selectedEventLocation.id}`,
        position: {
          lat: selectedEventLocation.geoLat,
          lng: selectedEventLocation.geoLng,
        },
        label: 'L',
        title: selectedEventLocation.name,
      });
    }
    return markers;
  }, [selectedEvent, selectedEventHasCoords, selectedEventLocation]);

  const eventMapCircles: RcpMapCircle[] = useMemo(() => {
    if (
      selectedEventLocation?.geoLat !== undefined &&
      selectedEventLocation.geoLng !== undefined &&
      selectedEventLocation.geoRadiusMeters
    ) {
      return [
        {
          id: `circle-${selectedEventLocation.id}`,
          center: {
            lat: selectedEventLocation.geoLat,
            lng: selectedEventLocation.geoLng,
          },
          radiusMeters: selectedEventLocation.geoRadiusMeters,
        },
      ];
    }
    return [];
  }, [selectedEventLocation]);

  // Guard - jeśli nie ma dostępu, nie renderuj niczego (przekierowanie w useEffect)
  if (!hasRcpAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-surface-900">Ładowanie...</div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-surface-50 border border-surface-300 rounded-xl p-8 text-center">
          <div className="text-surface-600 mb-4">
            Brak lokalizacji. Dodaj je w ustawieniach organizacji.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 mb-2">
              Rejestracja czasu pracy (RCP)
            </h1>
            <p className="text-surface-600">
              Generuj kody QR dla lokalizacji i umożliwiaj pracownikom rejestrowanie czasu pracy
            </p>
          </div>
        </div>

        {/* Events Overview */}
        <div className="bg-surface-50 border border-surface-300 rounded-xl p-6 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-900">
                Podgląd zdarzeń RCP
              </h2>
              <p className="text-sm text-surface-600">
                Ostatnie rejestracje pracowników z możliwością filtrowania.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchEvents(0)}
              disabled={eventsLoading}
              className="bg-surface-100 hover:bg-surface-200 text-surface-900 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {eventsLoading ? 'Odświeżanie...' : 'Odśwież'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={eventFilters.userId}
              onChange={(e) =>
                setEventFilters((prev) => ({ ...prev, userId: e.target.value }))
              }
              className="bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Wszyscy pracownicy</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} ({member.email})
                </option>
              ))}
            </select>

            <select
              value={eventFilters.locationId}
              onChange={(e) =>
                setEventFilters((prev) => ({
                  ...prev,
                  locationId: e.target.value,
                }))
              }
              className="bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Wszystkie lokalizacje</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>

            <select
              value={eventFilters.type}
              onChange={(e) =>
                setEventFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              className="bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Wszystkie statusy</option>
              <option value="CLOCK_IN">Wejście</option>
              <option value="CLOCK_OUT">Wyjście</option>
            </select>

            <input
              type="date"
              value={eventFilters.from}
              onChange={(e) =>
                setEventFilters((prev) => ({ ...prev, from: e.target.value }))
              }
              className="bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={eventFilters.to}
              onChange={(e) =>
                setEventFilters((prev) => ({ ...prev, to: e.target.value }))
              }
              className="bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="border border-surface-200 rounded-lg overflow-hidden bg-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 px-4 py-3 text-xs font-semibold text-surface-500 uppercase bg-surface-100">
              <span>Pracownik</span>
              <span>Status</span>
              <span>Lokalizacja</span>
              <span>Godzina</span>
              <span>Odległość / GPS</span>
            </div>
            <div className="divide-y divide-surface-200">
              {eventsLoading && (
                <div className="px-4 py-6 text-sm text-surface-600">
                  Ładowanie zdarzeń...
                </div>
              )}
              {!eventsLoading && eventsError && (
                <div className="px-4 py-6 text-sm text-red-600">
                  {eventsError}
                </div>
              )}
              {!eventsLoading && !eventsError && events.length === 0 && (
                <div className="px-4 py-6 text-sm text-surface-600">
                  Brak zdarzeń dla wybranych filtrów.
                </div>
              )}
              {!eventsLoading &&
                !eventsError &&
                events.map((event) => (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedEventId(event.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedEventId(event.id);
                      }
                    }}
                    className={`grid grid-cols-1 md:grid-cols-5 gap-4 px-4 py-3 text-sm text-surface-900 transition-colors ${
                      selectedEventId === event.id
                        ? 'bg-brand-50/60'
                        : 'hover:bg-surface-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">
                        {event.user?.firstName || ''}{' '}
                        {event.user?.lastName || ''}
                      </div>
                      <div className="text-xs text-surface-500">
                        {event.user?.email}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          event.type === 'CLOCK_IN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {event.type === 'CLOCK_IN' ? 'Wejście' : 'Wyjście'}
                      </span>
                    </div>
                    <div className="text-sm text-surface-700">
                      {event.locationName}
                    </div>
                    <div className="text-sm text-surface-700">
                      {new Date(event.happenedAt).toLocaleString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </div>
                    <div className="text-sm text-surface-700">
                      {event.distanceMeters}m
                      {event.accuracyMeters !== null && (
                        <span className="text-xs text-surface-500">
                          {' '}
                          • ±{Math.round(event.accuracyMeters)}m
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-surface-600">
            <span>
              {eventPagination.total > 0
                ? `Pokazujesz ${eventPagination.skip + 1}-${Math.min(
                    eventPagination.skip + eventPagination.take,
                    eventPagination.total,
                  )} z ${eventPagination.total}`
                : 'Brak wyników'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchEvents(Math.max(eventPagination.skip - eventPagination.take, 0))}
                disabled={eventsLoading || eventPagination.skip === 0}
                className="bg-surface-100 hover:bg-surface-200 text-surface-900 px-3 py-1 rounded-lg disabled:opacity-60"
              >
                ← Poprzednie
              </button>
              <button
                type="button"
                onClick={() =>
                  fetchEvents(eventPagination.skip + eventPagination.take)
                }
                disabled={
                  eventsLoading ||
                  eventPagination.skip + eventPagination.take >=
                    eventPagination.total
                }
                className="bg-surface-100 hover:bg-surface-200 text-surface-900 px-3 py-1 rounded-lg disabled:opacity-60"
              >
                Następne →
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-surface-700">
              Mapa wybranego zdarzenia
            </h3>
            {!selectedEvent && (
              <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-6 text-sm text-surface-600">
                Wybierz zdarzenie, aby zobaczyć lokalizację na mapie.
              </div>
            )}
            {selectedEvent && !selectedEventHasCoords && (
              <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-6 text-sm text-surface-600">
                Brak lokalizacji zapisanej dla tego zdarzenia.
              </div>
            )}
            {selectedEvent && selectedEventHasCoords && (
              <>
                <div className="h-64 w-full overflow-hidden rounded-lg border border-surface-200">
                  <RcpMap
                    center={eventMapCenter}
                    zoom={15}
                    markers={eventMapMarkers}
                    circles={eventMapCircles}
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                  <span>• IN/OUT = miejsce zdarzenia</span>
                  <span>• L = dozwolona lokalizacja</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Location Selection */}
            <div className="bg-surface-50 border border-surface-300 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-surface-900 mb-4">
                Wybierz lokalizację
              </h2>
              <select
                value={selectedLocation?.id || ''}
                onChange={(e) => {
                  const location = locations.find((l) => l.id === e.target.value);
                  setSelectedLocation(location || null);
                  setQrResult(null);
                  setQrDataUrl(null);
                  setQrToken(null);
                  setClockResult(null);
                }}
                className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.address ? ` (${location.address})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* RCP Settings */}
            {selectedLocation && (
              <div className="bg-surface-50 border border-surface-300 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-surface-900 mb-4">
                  Ustawienia RCP
                </h2>

                {/* Enable RCP */}
                <div className="flex items-center justify-between">
                  <label className="text-surface-900 font-medium">RCP włączone</label>
                  <button
                    type="button"
                    onClick={() =>
                      updateLocationSettings({
                        rcpEnabled: !selectedLocation.rcpEnabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedLocation.rcpEnabled
                        ? 'bg-brand-600'
                        : 'bg-surface-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedLocation.rcpEnabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Geolocation */}
                <div className="space-y-3">
                  <label className="block text-surface-900 font-medium">
                    Współrzędne geograficzne
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-surface-600 mb-1">
                        Szerokość geograficzna
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={selectedLocation.geoLat || ''}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            geoLat: parseFloat(e.target.value) || undefined,
                          })
                        }
                        onBlur={() =>
                          selectedLocation.geoLat &&
                          updateLocationSettings({ geoLat: selectedLocation.geoLat })
                        }
                        placeholder="52.2297"
                        className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-surface-600 mb-1">
                        Długość geograficzna
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={selectedLocation.geoLng || ''}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            geoLng: parseFloat(e.target.value) || undefined,
                          })
                        }
                        onBlur={() =>
                          selectedLocation.geoLng &&
                          updateLocationSettings({ geoLng: selectedLocation.geoLng })
                        }
                        placeholder="21.0122"
                        className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-surface-500">
                    Użyj Google Maps lub innej usługi aby znaleźć współrzędne lokalizacji
                  </p>
                  <div className="space-y-2">
                    {geocodeError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {geocodeError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedLocation) return;
                        const lat = selectedLocation.geoLat ?? geoState.lat;
                        const lng = selectedLocation.geoLng ?? geoState.lng;

                        if (lat === null || lat === undefined || lng === null || lng === undefined) {
                          pushToast('Uzupełnij współrzędne lub pobierz lokalizację GPS.', 'warning');
                          return;
                        }

                        setGeocodeLoading(true);
                        setGeocodeError(null);

                        try {
                          const response = await apiClient.request<GeocodeResponse>(
                            '/locations/geocode',
                            {
                              method: 'POST',
                              auth: true,
                              body: JSON.stringify({ lat, lng }),
                            },
                          );

                          const combinedStreet = [response.street, response.streetNumber]
                            .filter(Boolean)
                            .join(' ');
                          const formattedAddress =
                            response.formattedAddress ?? (combinedStreet || undefined);

                          await updateLocationSettings({
                            geoLat: lat,
                            geoLng: lng,
                            addressStreet: combinedStreet || undefined,
                            addressPostalCode: response.postalCode ?? undefined,
                            addressCity: response.city ?? undefined,
                            addressCountry: response.country ?? undefined,
                            address: formattedAddress,
                          });

                          pushToast('Adres lokalizacji został uzupełniony.', 'success');
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : 'Nie udało się pobrać adresu lokalizacji';
                          setGeocodeError(errorMessage);
                          pushToast(errorMessage, 'error');
                        } finally {
                          setGeocodeLoading(false);
                        }
                      }}
                      disabled={geocodeLoading}
                      className="w-full rounded-lg border border-brand-600 text-brand-700 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-surface-200 disabled:text-surface-400"
                    >
                      {geocodeLoading ? 'Pobieranie adresu...' : 'Pobierz lokalizację'}
                    </button>
                    <p className="text-xs text-surface-500">
                      Pobierze adres na podstawie współrzędnych (Google Maps).
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-surface-900 font-medium">
                    Adres lokalizacji
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-surface-600 mb-1">
                        Ulica i numer
                      </label>
                      <input
                        type="text"
                        value={selectedLocation.addressStreet || ''}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            addressStreet: e.target.value || undefined,
                          })
                        }
                        onBlur={() =>
                          updateLocationSettings({
                            addressStreet: selectedLocation.addressStreet,
                          })
                        }
                        placeholder="ul. Marszałkowska 10"
                        className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-surface-600 mb-1">
                          Kod pocztowy
                        </label>
                        <input
                          type="text"
                          value={selectedLocation.addressPostalCode || ''}
                          onChange={(e) =>
                            setSelectedLocation({
                              ...selectedLocation,
                              addressPostalCode: e.target.value || undefined,
                            })
                          }
                          onBlur={() =>
                            updateLocationSettings({
                              addressPostalCode: selectedLocation.addressPostalCode,
                            })
                          }
                          placeholder="00-000"
                          className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-surface-600 mb-1">
                          Miasto
                        </label>
                        <input
                          type="text"
                          value={selectedLocation.addressCity || ''}
                          onChange={(e) =>
                            setSelectedLocation({
                              ...selectedLocation,
                              addressCity: e.target.value || undefined,
                            })
                          }
                          onBlur={() =>
                            updateLocationSettings({
                              addressCity: selectedLocation.addressCity,
                            })
                          }
                          placeholder="Warszawa"
                          className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-surface-600 mb-1">
                        Kraj
                      </label>
                      <input
                        type="text"
                        value={selectedLocation.addressCountry || ''}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            addressCountry: e.target.value || undefined,
                          })
                        }
                        onBlur={() =>
                          updateLocationSettings({
                            addressCountry: selectedLocation.addressCountry,
                          })
                        }
                        placeholder="Polska"
                        className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Radius */}
                <div>
                  <label className="block text-surface-900 font-medium mb-2">
                    Promień geofence: {selectedLocation.geoRadiusMeters || 100}m
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={selectedLocation.geoRadiusMeters || 100}
                    onChange={(e) =>
                      setSelectedLocation({
                        ...selectedLocation,
                        geoRadiusMeters: parseInt(e.target.value),
                      })
                    }
                    onMouseUp={() =>
                      updateLocationSettings({
                        geoRadiusMeters: selectedLocation.geoRadiusMeters,
                      })
                    }
                    className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-surface-500 mt-1">
                    <span>10m</span>
                    <span>500m</span>
                  </div>
                </div>

                {/* Max Accuracy */}
                <div>
                  <label className="block text-surface-900 font-medium mb-2">
                    Maksymalna dozwolona niedokładność GPS
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    max="500"
                    value={selectedLocation.rcpAccuracyMaxMeters}
                    onChange={(e) =>
                      setSelectedLocation({
                        ...selectedLocation,
                        rcpAccuracyMaxMeters: parseInt(e.target.value) || 100,
                      })
                    }
                    onBlur={() =>
                      updateLocationSettings({
                        rcpAccuracyMaxMeters: selectedLocation.rcpAccuracyMaxMeters,
                      })
                    }
                    className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    Rejestracja zostanie odrzucona jeśli dokładność GPS przekroczy tę wartość (w metrach)
                  </p>
                </div>

                <div className="bg-accent-50 border border-accent-200 rounded-lg p-3 text-sm text-accent-800">
                  ℹ️ Upewnij się że współrzędne i promień są poprawnie ustawione przed wygenerowaniem kodu QR
                </div>
              </div>
            )}
          </div>

          {/* Right Column - QR Generation */}
          <div className="space-y-6">
            {/* Quick punch */}
            <div className="bg-surface-50 border border-surface-300 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-surface-900">
                  Twoje wejście/wyjście
                </h2>
                <button
                  type="button"
                  onClick={() => fetchStatus(selectedLocation?.id)}
                  disabled={statusLoading}
                  className="text-xs text-brand-600 hover:text-brand-700 disabled:text-surface-400"
                >
                  {statusLoading ? 'Odświeżanie...' : 'Odśwież status'}
                </button>
              </div>

              {status?.lastEvent && (
                <div className="rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm text-surface-700">
                  <div className="font-medium text-surface-900">
                    {status.isClockedIn ? '🟢 Zalogowany' : '🔴 Wylogowany'}
                  </div>
                  <div className="text-xs text-surface-500">
                    {status.lastEvent.locationName} •{' '}
                    {new Date(status.lastEvent.happenedAt).toLocaleString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </div>
              )}

              {!status?.lastEvent && (
                <div className="rounded-lg border border-dashed border-surface-200 bg-white px-4 py-3 text-sm text-surface-600">
                  Brak zarejestrowanych zdarzeń dla wybranej lokalizacji.
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium text-surface-900">📍 Lokalizacja GPS</div>
                {geoState.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {geoState.error}
                  </div>
                )}
                {geoState.lat === null && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={geoState.loading}
                    className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:bg-surface-300"
                  >
                    {geoState.loading ? 'Pobieranie...' : 'Pobierz lokalizację'}
                  </button>
                )}
                {geoState.lat !== null && geoState.lng !== null && (
                  <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-surface-600">
                    <div>Szerokość: {geoState.lat.toFixed(6)}°</div>
                    <div>Długość: {geoState.lng.toFixed(6)}°</div>
                    {geoState.accuracy && (
                      <div>Dokładność: ±{Math.round(geoState.accuracy)}m</div>
                    )}
                  </div>
                )}
              </div>

              {!qrToken && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  Aby wykonać wejście/wyjście, wygeneruj kod QR dla lokalizacji.
                </div>
              )}
              {qrToken && qrResult && (
                <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-surface-600">
                  Token aktywny do:{' '}
                  <span className="font-medium text-surface-900">
                    {new Date(qrResult.tokenExpiresAt).toLocaleString('pl-PL')}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleClock('CLOCK_IN')}
                  disabled={clockLoading || !qrToken || status?.isClockedIn === true}
                  className="rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-surface-300"
                >
                  Wejście
                </button>
                <button
                  type="button"
                  onClick={() => handleClock('CLOCK_OUT')}
                  disabled={clockLoading || !qrToken || !status?.isClockedIn}
                  className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-surface-300"
                >
                  Wyjście
                </button>
              </div>

              {clockResult && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    clockResult.success
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <div>{clockResult.message}</div>
                  {clockResult.distance !== undefined && (
                    <div className="opacity-80">
                      Odległość od lokalizacji: {clockResult.distance}m
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate QR */}
            <div className="bg-surface-50 border border-surface-300 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-surface-900 mb-4">
                Generowanie kodu QR
              </h2>

              {!selectedLocation?.rcpEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm mb-4">
                  ⚠️ RCP nie jest włączone dla tej lokalizacji
                </div>
              )}

              {selectedLocation?.rcpEnabled &&
                (!selectedLocation.geoLat || !selectedLocation.geoLng) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm mb-4">
                    ⚠️ Uzupełnij współrzędne geograficzne lokalizacji
                  </div>
                )}

              <button
                type="button"
                onClick={generateQr}
                disabled={
                  generating ||
                  !selectedLocation?.rcpEnabled ||
                  !selectedLocation.geoLat ||
                  !selectedLocation.geoLng
                }
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
              >
                {generating ? 'Generowanie...' : '🔄 Wygeneruj kod QR'}
              </button>

              {/* QR Code Display */}
              {qrDataUrl && qrResult && (
                <div className="mt-6 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-surface-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="text-center text-sm text-surface-600">
                    Token wygasa:{' '}
                    <span className="text-surface-900 font-medium">
                      {new Date(qrResult.tokenExpiresAt).toLocaleString('pl-PL')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={downloadQr}
                      className="bg-surface-100 hover:bg-surface-200 text-surface-900 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      ⬇️ Pobierz
                    </button>
                    <button
                      type="button"
                      onClick={printQr}
                      className="bg-surface-100 hover:bg-surface-200 text-surface-900 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      🖨️ Drukuj
                    </button>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-800 text-sm">
                    ✅ Kod QR gotowy! Pracownicy mogą go zeskanować aby zarejestrować
                    wejście lub wyjście z pracy.
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-surface-50 border border-surface-300 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-3">
                Instrukcja użycia
              </h3>
              <ol className="space-y-2 text-sm text-surface-700">
                <li className="flex gap-2">
                  <span className="font-bold text-brand-600">1.</span>
                  <span>
                    Ustaw współrzędne geograficzne lokalizacji (możesz użyć Google
                    Maps)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-brand-600">2.</span>
                  <span>
                    Dostosuj promień geofence (domyślnie 100m) – pracownicy muszą
                    być w tym promieniu
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-brand-600">3.</span>
                  <span>Włącz RCP dla lokalizacji</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-brand-600">4.</span>
                  <span>Wygeneruj kod QR i wydrukuj lub udostępnij pracownikom</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-brand-600">5.</span>
                  <span>
                    Pracownicy skanują kod, zezwalają na dostęp do lokalizacji i
                    rejestrują wejście/wyjście
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

    </>
  );
}
