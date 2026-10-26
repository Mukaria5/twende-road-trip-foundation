/**
 * Centralised map + geocoding provider configuration.
 *
 * Providers are deliberately replaceable: change the tile URL/attribution here,
 * or point the server-side geocoder elsewhere via NOMINATIM_BASE_URL /
 * NOMINATIM_USER_AGENT env settings, without touching map components.
 *
 * Public OSM tiles and Nominatim are free but capacity is NOT unlimited —
 * respect their published usage policies and swap to a dedicated provider
 * before scaling beyond light traffic.
 */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface GeoPlace {
  id: string;
  name: string;
  /** Town / county / state, when the provider returned one. */
  locality: string | null;
  latitude: number;
  longitude: number;
}

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  /** Place name only when resolved by the geocoder — never invented for pins. */
  name: string | null;
  locality: string | null;
}

export interface UserLocationFix extends LatLngLiteral {
  /** GPS accuracy in metres, when reported. */
  accuracy: number | null;
}

export const MAP_PROVIDER = {
  tiles: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  /** Default view: roughly the centre of Kenya. */
  kenyaCenter: { lat: -0.42, lng: 37.2 } satisfies LatLngLiteral,
  kenyaZoom: 6,
  /** Zoom used when a place result or pin is confirmed. */
  detailZoom: 15,
  userLocationZoom: 16,
  search: {
    minLength: 3,
    debounceMs: 500,
    limit: 6,
    /** Kenya-first results; widen for cross-border coverage later. */
    countryCode: "ke",
  },
} as const;

/** Display coordinates at 5 decimals (~1 m precision). */
export function formatLatLng(point: LatLngLiteral): string {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}
