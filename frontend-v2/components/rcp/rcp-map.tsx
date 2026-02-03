'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';
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
}

const containerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
};

export default function RcpMap({
  center,
  zoom = 15,
  markers = [],
  circles = [],
  className,
}: RcpMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader(
    useMemo(
      () => ({
        id: 'rcp-google-maps',
        googleMapsApiKey: apiKey ?? '',
      }),
      [apiKey],
    ),
  );

  const fallbackSrc = `https://www.google.com/maps?q=${center.lat},${center.lng}&z=${zoom}&output=embed`;

  if (!apiKey) {
    return (
      <div className={`relative h-full overflow-hidden rounded-lg ${className ?? ''}`}>
        <iframe
          title="Mapa lokalizacji"
          src={fallbackSrc}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-start justify-center bg-black/35 p-3 text-xs text-white">
          Brak klucza Google Maps. Ustaw NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`relative h-full overflow-hidden rounded-lg ${className ?? ''}`}>
        <iframe
          title="Mapa lokalizacji"
          src={fallbackSrc}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-start justify-center bg-black/35 p-3 text-xs text-white">
          Nie udało się załadować Google Maps.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex h-full items-center justify-center rounded-lg border border-gray-700 bg-gray-900/40 text-sm text-gray-300 ${className ?? ''}`}
      >
        Ładowanie mapy...
      </div>
    );
  }

  return (
    <div className={className}>
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
