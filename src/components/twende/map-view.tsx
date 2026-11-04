import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  MAP_PROVIDER,
  type LatLngLiteral,
  type SelectedLocation,
  type TripPoint,
  type UserLocationFix,
} from "@/lib/twende/map-providers";
import type { CalculatedRoute } from "@/lib/twende/route.functions";

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
  /** Planned trip endpoints and intermediate stops (Phase 2). */
  start?: TripPoint | null;
  destination?: TripPoint | null;
  stops?: TripPoint[];
  /** Candidate driving routes; index 0 is the primary. */
  routes?: CalculatedRoute[];
  selectedRouteIndex?: number;
  /** Changes whenever the map should re-fit to the trip/route. */
  fitKey?: string;
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
  start,
  destination,
  stops,
  routes,
  selectedRouteIndex = 0,
  fitKey,
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

  // Route lines use the design tokens' computed values — SVG path attributes
  // cannot resolve var() directly.
  const lineColors = useMemo(() => {
    if (typeof window === "undefined") {
      return { primary: "#b4551e", muted: "#8a7f74" };
    }
    const styles = getComputedStyle(document.documentElement);
    return {
      primary: styles.getPropertyValue("--color-primary").trim() || "#b4551e",
      muted: styles.getPropertyValue("--color-muted-foreground").trim() || "#8a7f74",
    };
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

  const startIcon = useMemo(
    () =>
      L.divIcon({
        className: "twende-map-endpoint",
        html: '<span class="twende-endpoint" aria-hidden="true">A</span>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    [],
  );

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: "twende-map-endpoint",
        html: '<span class="twende-endpoint twende-endpoint-dest" aria-hidden="true">B</span>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    [],
  );

  const stopIcon = useMemo(
    () =>
      L.divIcon({
        className: "twende-map-endpoint",
        html: '<span class="twende-endpoint twende-endpoint-stop" aria-hidden="true"></span>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    [],
  );

  const selectedRoute = routes?.[Math.min(selectedRouteIndex, routes.length - 1)] ?? null;

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
      <MapFitter
        fitKey={fitKey ?? ""}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        start={start}
        destination={destination}
        stops={stops}
      />

      {routes?.map((route, index) => {
        if (route === selectedRoute) return null;
        return (
          <Polyline
            key={`alternative-${index}`}
            positions={route.coordinates}
            pathOptions={{
              color: lineColors.muted,
              weight: 4,
              opacity: 0.5,
              dashArray: "1 9",
              lineCap: "round",
            }}
            interactive={false}
          />
        );
      })}
      {selectedRoute && (
        <Polyline
          key={`selected-${selectedRouteIndex}-${selectedRoute.coordinates.length}`}
          positions={selectedRoute.coordinates}
          pathOptions={{ color: lineColors.primary, weight: 5, opacity: 0.9 }}
          interactive={false}
        />
      )}

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
      {start && (
        <Marker
          position={[start.latitude, start.longitude]}
          icon={startIcon}
          keyboard={false}
        />
      )}
      {destination && (
        <Marker
          position={[destination.latitude, destination.longitude]}
          icon={destinationIcon}
          keyboard={false}
        />
      )}
      {(stops ?? []).map((stop, index) => (
        <Marker
          key={`stop-${index}-${stop.latitude}-${stop.longitude}`}
          position={[stop.latitude, stop.longitude]}
          icon={stopIcon}
          keyboard={false}
        />
      ))}
    </MapContainer>
  );
}

function MapClickHandler({ onSelect }: { onSelect: (point: LatLngLiteral) => void }) {
  useMapEvents({
    click: (event) => onSelect({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}

/** Re-fits the viewport to the planned route, or to the chosen points. */
function MapFitter({
  fitKey,
  routes,
  selectedRouteIndex,
  start,
  destination,
  stops,
}: {
  fitKey: string;
  routes?: CalculatedRoute[] | undefined;
  selectedRouteIndex: number;
  start?: TripPoint | null | undefined;
  destination?: TripPoint | null | undefined;
  stops?: TripPoint[] | undefined;
}) {
  const map = useMap();
  const lastFitKey = useRef<string | null>(null);

  useEffect(() => {
    if (!fitKey || lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;
    const points: [number, number][] = [];
    const selectedRoute = routes?.[Math.min(selectedRouteIndex, (routes?.length ?? 1) - 1)];
    if (selectedRoute) {
      for (const pair of selectedRoute.coordinates) {
        if (Array.isArray(pair) && Number.isFinite(pair[0]) && Number.isFinite(pair[1])) {
          points.push([pair[0], pair[1]]);
        }
      }
    }
    if (points.length < 2) {
      points.length = 0;
      for (const point of [start, destination, ...(stops ?? [])]) {
        if (point) points.push([point.latitude, point.longitude]);
      }
    }
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    } else if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 13));
    }
  }, [fitKey, routes, selectedRouteIndex, start, destination, stops]);

  return null;
}
