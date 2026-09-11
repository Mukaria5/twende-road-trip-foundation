/**
 * Geographic helpers for trip recording.
 *
 * Distance is computed locally with the Haversine formula from recorded GPS
 * points — never estimated by a model and never derived from the route's
 * curated distance.
 */

export interface TrackPoint {
  latitude: number;
  longitude: number;
  /** epoch milliseconds */
  recorded_at: number;
  accuracy?: number | null;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Reject readings that are too imprecise to be useful for distance. */
export const MAX_ACCURACY_M = 100;
/** Ignore jitter below this — a parked phone otherwise "drives" all day. */
export const MIN_STEP_KM = 0.02;
/** Anything faster than this between two points is a GPS glitch, not driving. */
export const MAX_SPEED_KMH = 220;

/**
 * Decide whether a new point is a plausible continuation of the track.
 * Rejects low-accuracy fixes, standing-still jitter and impossible jumps.
 */
export function isPlausibleStep(
  previous: TrackPoint | null,
  next: TrackPoint,
): { accept: boolean; distanceKm: number } {
  if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude)) {
    return { accept: false, distanceKm: 0 };
  }
  if (next.accuracy != null && next.accuracy > MAX_ACCURACY_M) {
    return { accept: false, distanceKm: 0 };
  }
  if (!previous) return { accept: true, distanceKm: 0 };

  const distanceKm = haversineKm(previous, next);
  if (distanceKm < MIN_STEP_KM) return { accept: false, distanceKm: 0 };

  const hours = (next.recorded_at - previous.recorded_at) / 3_600_000;
  if (hours <= 0) return { accept: false, distanceKm: 0 };
  if (distanceKm / hours > MAX_SPEED_KMH) return { accept: false, distanceKm: 0 };

  return { accept: true, distanceKm };
}

/** Total distance of an ordered track, applying the same plausibility rules. */
export function trackDistanceKm(points: TrackPoint[]): number {
  let total = 0;
  let previous: TrackPoint | null = null;
  for (const point of points) {
    const { accept, distanceKm } = isPlausibleStep(previous, point);
    if (!accept) continue;
    total += distanceKm;
    previous = point;
  }
  return total;
}

export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0m";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatClock(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
