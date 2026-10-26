import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import {
  MAP_PROVIDER,
  type LatLngLiteral,
  type SelectedLocation,
  type UserLocationFix,
} from "@/lib/twende/map-providers";

interface MapViewProps {
  center: LatLngLiteral;
  /** Changes whenever the page wants the map to fly somewhere new. */
  centerKey: string;
  zoom: number;
  selected: SelectedLocation | null;
  userLocation: UserLocationFix | null;
  onSelect: (point: LatLngLiteral) => void;
  onTilesLoading: (loading: boolean) => void;
  onTilesError: (failed: boolean) => void;
  onReady?: (map: L.Map) => void;
}

/** Browser-only component: always loaded via React.lazy behind <ClientOnly>. */
export default function MapView({
  center,
  centerKey,
  zoom,
  selected,
  userLocation,
  onSelect,
  onTilesLoading,
  onTilesError,
  onReady,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const lastCenterKey = useRef<string | null>(null);

  useEffect(() => {
    if (mapRef.current) onReady?.(mapRef.current);
  }, [onReady]);

  // Fly to a new centre when the page changes it (search result, user fix, preset).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lastCenterKey.current === null) {
      // First render: the map already starts at this centre — no animation.
      lastCenterKey.current = centerKey;
      return;
    }
    if (lastCenterKey.current === centerKey) return;
    lastCenterKey.current = centerKey;
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [center, centerKey, zoom]);

  // Re-measure after rotations, viewport changes or tab switches.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, []);

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: "twende-map-pin",
        html: '<svg viewBox="0 0 24 30" width="26" height="32" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 9.5 16.4 11.2 17.6.5.4 1.1.4 1.6 0C14.5 28.4 24 20.4 24 12 24 5.4 18.6 0 12 0z" fill="currentColor"/><circle cx="12" cy="11.6" r="4.2" fill="var(--color-card, #fff)"/></svg>',
        iconSize: [26, 32],
        iconAnchor: [13, 32],
      }),
    [],
  );

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: "twende-map-user",
        html: '<span class="twende-map-user-dot"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    [],
  );

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      minZoom={5}
      maxZoom={MAP_PROVIDER.tiles.maxZoom}
      zoomControl={false}
      scrollWheelZoom
      worldCopyJump
      className="absolute inset-0"
      ref={(map) => {
        mapRef.current = map;
      }}
    >
      <TileLayer
        url={MAP_PROVIDER.tiles.url}
        attribution={MAP_PROVIDER.tiles.attribution}
        maxZoom={MAP_PROVIDER.tiles.maxZoom}
        eventHandlers={{
          loading: () => onTilesLoading(true),
          load: () => onTilesLoading(false),
          tileerror: () => onTilesError(true),
          tileload: () => onTilesError(false),
        }}
      />
      <MapClickHandler onSelect={onSelect} />
      {selected && (
        <Marker
          position={[selected.latitude, selected.longitude]}
          icon={pinIcon}
          keyboard={false}
        />
      )}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userIcon}
          keyboard={false}
        />
      )}
    </MapContainer>
  );
}

function MapClickHandler({ onSelect }: { onSelect: (point: LatLngLiteral) => void }) {
  useMapEvents({
    click: (event) => onSelect({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}
