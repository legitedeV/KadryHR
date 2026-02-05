'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';

export interface RcpMapMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  label?: string;
  title?: string;
}

export interface RcpMapCircle {
  id: string;
  center: google.maps.LatLngLiteral;
  radiusMeters: number;
  color?: string;
}

interface RcpMapProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: RcpMapMarker[];
  circles?: RcpMapCircle[];
  className?: string;
  heightPx?: number;
}

const DEFAULT_HEIGHT_PX = 320;

function RcpMapFallback({
  center,
  zoom,
  className,
  message,
  heightPx,
}: {
  center: google.maps.LatLngLiteral;
  zoom: number;
  className?: string;
  message: string;
  heightPx: number;
}) {
  const fallbackSrc = `https://www.google.com/maps?q=${center.lat},${center.lng}&z=${zoom}&output=embed`;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${className ?? ''}`}
      style={{ height: `${heightPx}px` }}
    >
      <iframe
        title="Mapa lokalizacji"
        src={fallbackSrc}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-start justify-center bg-black/35 p-3 text-xs text-white">
        {message}
      </div>
    </div>
  );
}

function RcpMapLoaded({
  center,
  zoom,
  markers,
  circles,
  className,
  apiKey,
  heightPx,
}: RcpMapProps & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader(
    useMemo(
      () => ({
        id: 'rcp-google-maps',
        googleMapsApiKey: apiKey,
      }),
      [apiKey],
    ),
  );
  const loggedErrorRef = useRef(false);
  const containerStyle: CSSProperties = useMemo(
    () => ({
      width: '100%',
      height: `${heightPx}px`,
    }),
    [heightPx],
  );

  useEffect(() => {
    if (loadError && !loggedErrorRef.current) {
      console.error('Google Maps failed to load on RCP map.', loadError);
      loggedErrorRef.current = true;
    }
  }, [loadError]);

  if (loadError) {
    return (
      <RcpMapFallback
        center={center}
        zoom={zoom ?? 15}
        className={className}
        message="Nie udało się załadować Google Maps."
        heightPx={heightPx}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-900/40 text-sm text-gray-300 ${className ?? ''}`}
        style={{ height: `${heightPx}px` }}
      >
        Ładowanie mapy...
      </div>
    );
  }

  return (
    <div className={`w-full ${className ?? ''}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {circles.map((circle) => (
          <Circle
            key={circle.id}
            center={circle.center}
            radius={circle.radiusMeters}
            options={{
              fillColor: circle.color ?? '#4F46E5',
              fillOpacity: 0.15,
              strokeColor: circle.color ?? '#4F46E5',
              strokeOpacity: 0.6,
              strokeWeight: 2,
            }}
          />
        ))}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            label={marker.label}
            title={marker.title}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

export default function RcpMap({
  center,
  zoom = 15,
  markers = [],
  circles = [],
  className,
  heightPx = DEFAULT_HEIGHT_PX,
}: RcpMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <RcpMapFallback
        center={center}
        zoom={zoom}
        className={className}
        message="Mapa tymczasowo niedostępna (brak klucza Google Maps)."
        heightPx={heightPx}
      />
    );
  }

  return (
    <RcpMapLoaded
      center={center}
      zoom={zoom}
      markers={markers}
      circles={circles}
      className={className}
      apiKey={apiKey}
      heightPx={heightPx}
    />
  );
}
