'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { pushToast } from '@/lib/toast';
import { useAuth } from '@/lib/auth-context';
import QRCode from 'qrcode';

interface Location {
  id: string;
  name: string;
  address?: string;
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

interface CreateLocationPayload {
  name: string;
  geoLat?: number;
  geoLng?: number;
  geoRadiusMeters?: number;
  rcpEnabled?: boolean;
  rcpAccuracyMaxMeters?: number;
}

export default function PanelRcpPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrResult, setQrResult] = useState<QrResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<CreateLocationPayload>({
    name: '',
    geoRadiusMeters: 100,
    rcpEnabled: true,
    rcpAccuracyMaxMeters: 100,
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
    }
  }, [hasRcpAccess, router]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Location[]>('/locations', {
        auth: true,
      });
      setLocations(response);
      if (response.length > 0) {
        setSelectedLocation(response[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać lokalizacji';
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

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
      const result = await apiClient.post<QrResult>(
        '/rcp/qr/generate',
        {
          locationId: selectedLocation.id,
        },
        { auth: true },
      );

      setQrResult(result);

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

  const createLocation = async () => {
    if (!newLocation.name.trim()) {
      pushToast('Nazwa lokalizacji jest wymagana', 'error');
      return;
    }

    setCreatingLocation(true);
    try {
      const payload: CreateLocationPayload = {
        name: newLocation.name,
      };
      
      // Dodaj opcjonalne pola tylko jeśli są ustawione
      if (newLocation.geoLat !== undefined) payload.geoLat = newLocation.geoLat;
      if (newLocation.geoLng !== undefined) payload.geoLng = newLocation.geoLng;
      if (newLocation.geoRadiusMeters !== undefined) payload.geoRadiusMeters = newLocation.geoRadiusMeters;
      if (newLocation.rcpEnabled !== undefined) payload.rcpEnabled = newLocation.rcpEnabled;
      if (newLocation.rcpAccuracyMaxMeters !== undefined) payload.rcpAccuracyMaxMeters = newLocation.rcpAccuracyMaxMeters;

      const created = await apiClient.post<Location>('/locations', payload, { auth: true });
      
      pushToast('Lokalizacja została utworzona', 'success');
      setShowLocationModal(false);
      setNewLocation({
        name: '',
        geoRadiusMeters: 100,
        rcpEnabled: true,
        rcpAccuracyMaxMeters: 100,
      });
      
      // Odśwież listę lokalizacji
      await fetchLocations();
      
      // Ustaw jako wybraną
      setSelectedLocation(created);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się utworzyć lokalizacji';
      pushToast(errorMessage, 'error');
    } finally {
      setCreatingLocation(false);
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
      await apiClient.patch(
        `/locations/${selectedLocation.id}`,
        updates,
        { auth: true },
      );

      setSelectedLocation({ ...selectedLocation, ...updates });
      setLocations(
        locations.map((loc) =>
          loc.id === selectedLocation.id ? { ...loc, ...updates } : loc,
        ),
      );

      pushToast('Ustawienia zaktualizowane', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się zaktualizować ustawień';
      pushToast(errorMessage, 'error');
    }
  };

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
            Brak lokalizacji. Najpierw dodaj lokalizację.
          </div>
          <button 
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Dodaj lokalizację
          </button>
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
          <button 
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            + Dodaj lokalizację
          </button>
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

      {/* Modal lokalizacji */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-surface-900">Nowa lokalizacja</h2>
              <button
                type="button"
                onClick={() => {
                  setShowLocationModal(false);
                  setNewLocation({
                    name: '',
                    geoRadiusMeters: 100,
                    rcpEnabled: true,
                    rcpAccuracyMaxMeters: 100,
                  });
                }}
                className="text-surface-500 hover:text-surface-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-900 mb-1">
                  Nazwa lokalizacji *
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="np. Sklep Warszawa Centrum"
                  className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-900 mb-1">
                    Szerokość geogr.
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newLocation.geoLat || ''}
                    onChange={(e) => setNewLocation({ ...newLocation, geoLat: parseFloat(e.target.value) || undefined })}
                    placeholder="52.2297"
                    className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-900 mb-1">
                    Długość geogr.
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newLocation.geoLng || ''}
                    onChange={(e) => setNewLocation({ ...newLocation, geoLng: parseFloat(e.target.value) || undefined })}
                    placeholder="21.0122"
                    className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-900 mb-1">
                  Promień geofence (metry)
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={newLocation.geoRadiusMeters || 100}
                  onChange={(e) => setNewLocation({ ...newLocation, geoRadiusMeters: parseInt(e.target.value) || 100 })}
                  className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-900 mb-1">
                  Maks. niedokładność GPS (metry)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={newLocation.rcpAccuracyMaxMeters || 100}
                  onChange={(e) => setNewLocation({ ...newLocation, rcpAccuracyMaxMeters: parseInt(e.target.value) || 100 })}
                  className="w-full bg-white border border-surface-300 text-surface-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-border)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rcpEnabled"
                  checked={newLocation.rcpEnabled || false}
                  onChange={(e) => setNewLocation({ ...newLocation, rcpEnabled: e.target.checked })}
                  className="rounded border-surface-300 text-[var(--accent)] focus:ring-[var(--focus-ring)]"
                />
                <label htmlFor="rcpEnabled" className="text-sm text-surface-900">
                  RCP włączone
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLocationModal(false);
                  setNewLocation({
                    name: '',
                    geoRadiusMeters: 100,
                    rcpEnabled: true,
                    rcpAccuracyMaxMeters: 100,
                  });
                }}
                className="flex-1 bg-surface-100 hover:bg-surface-200 text-surface-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={createLocation}
                disabled={creatingLocation || !newLocation.name.trim()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-surface-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {creatingLocation ? 'Tworzenie...' : 'Utwórz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
