import { z } from "zod";

import type { TripPoint } from "./map-providers";

/**
 * Shareable encoding of a map selection (start, destination, stops and the
 * chosen route option) so the Map screen and the custom planner can hand the
 * same selection back and forth without inventing or losing data.
 *
 * Format per point: `encodedName|lat|lng` — encodeURIComponent never emits a
 * raw "|", so splitting on it is safe. Waypoints are joined with ";", which is
 * also always encoded inside names.
 */

export const tripSearchSchema = z.object({
  start: z.string().optional(),
  dest: z.string().optional(),
  wp: z.string().optional(),
  route: z.coerce.number().int().min(0).max(8).optional(),
});

export type TripSearchParams = z.infer<typeof tripSearchSchema>;

export function encodeTripPoint(point: TripPoint): string {
  const name = point.name ? encodeURIComponent(point.name) : "";
  return `${name}|${point.latitude}|${point.longitude}`;
}

export function decodeTripPoint(raw: string | undefined): TripPoint | null {
  if (!raw) return null;
  const parts = raw.split("|");
  if (parts.length !== 3) return null;
  const [name, lat, lng] = parts;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  let decodedName = "";
  if (name) {
    try {
      decodedName = decodeURIComponent(name).trim();
    } catch {
      decodedName = name.trim();
    }
  }
  return { name: decodedName || null, locality: null, latitude, longitude };
}

export function encodeWaypoints(list: TripPoint[]): string | undefined {
  if (list.length === 0) return undefined;
  return list.map(encodeTripPoint).join(";");
}

export function decodeWaypoints(raw: string | undefined): TripPoint[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map(decodeTripPoint)
    .filter((point): point is TripPoint => point !== null);
}

/** Display label: verified name when there is one, otherwise coordinates. */
export function pointLabel(point: TripPoint | null): string {
  if (!point) return "—";
  return point.name ?? `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

/** Coordinates-only view for a trip point, as the routing input expects. */
export function toRoutePoint(point: TripPoint): { latitude: number; longitude: number } {
  return { latitude: point.latitude, longitude: point.longitude };
}
