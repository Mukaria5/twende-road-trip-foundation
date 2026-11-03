import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MAP_PROVIDER } from "./map-providers";

export type RouteCalculationError =
  | "network"
  | "rate-limited"
  | "provider"
  | "unreachable"
  | "invalid";

/** A driving route: distance/duration plus its polyline as [lat, lng] pairs. */
export interface CalculatedRoute {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
}

export interface RouteCalculationResult {
  routes: CalculatedRoute[];
  error: RouteCalculationError | null;
}

const pointInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const routeInput = z.object({
  start: pointInput,
  destination: pointInput,
  waypoints: z
    .array(pointInput)
    .max(MAP_PROVIDER.routing.maxWaypoints)
    .optional()
    .default([]),
  alternatives: z.boolean().optional().default(false),
});

interface OsrmRoute {
  distance?: number;
  duration?: number;
  geometry?: { coordinates?: [number, number][] };
}

interface OsrmResponse {
  code?: string;
  routes?: OsrmRoute[];
}

/**
 * Driving-route calculation, proxied through a server function so the routing
 * provider stays replaceable via OSRM_BASE_URL and no third-party endpoint is
 * ever called from the browser. Failures come back as a typed status the UI
 * can explain. Distances and durations are always the provider's own figures —
 * never fabricated locally.
 */
export const calculateRoute = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => routeInput.parse(input))
  .handler(async ({ data }): Promise<RouteCalculationResult> => {
    const base = (
      process.env["OSRM_BASE_URL"] || "https://router.project-osrm.org"
    ).replace(/\/+$/, "");

    const coords = [data.start, ...data.waypoints, data.destination]
      .map((point) => `${point.longitude},${point.latitude}`)
      .join(";");
    const params = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      steps: "false",
      alternatives: data.alternatives ? String(MAP_PROVIDER.routing.maxAlternatives) : "false",
    });

    try {
      const response = await fetch(`${base}/route/v1/driving/${coords}?${params.toString()}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(MAP_PROVIDER.routing.requestTimeoutMs),
      });

      if (response.status === 429 || response.status === 503) {
        return { routes: [], error: "rate-limited" };
      }
      if (!response.ok) {
        return { routes: [], error: "provider" };
      }

      const payload = (await response.json()) as OsrmResponse;
      if (payload.code === "NoRoute") {
        return { routes: [], error: "unreachable" };
      }
      if (payload.code === "NoSegment" || payload.code === "InvalidInput") {
        return { routes: [], error: "invalid" };
      }
      if (payload.code !== "Ok" || !Array.isArray(payload.routes) || payload.routes.length === 0) {
        return { routes: [], error: "provider" };
      }

      const routes: CalculatedRoute[] = [];
      for (const item of payload.routes) {
        const distanceKm = Number(item.distance);
        const durationMinutes = Number(item.duration);
        const rawCoordinates = item.geometry?.coordinates;
        if (
          !Number.isFinite(distanceKm) ||
          !Number.isFinite(durationMinutes) ||
          !Array.isArray(rawCoordinates) ||
          rawCoordinates.length < 2
        ) {
          continue;
        }
        // GeoJSON coordinates are [lng, lat]; flip them for Leaflet.
        const coordinates: [number, number][] = [];
        for (const pair of rawCoordinates) {
          const [lng, lat] = pair;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          coordinates.push([lat, lng]);
        }
        if (coordinates.length < 2) continue;
        routes.push({
          distanceKm: distanceKm / 1000,
          durationMinutes: durationMinutes / 60,
          coordinates,
        });
      }

      if (routes.length === 0) return { routes: [], error: "provider" };
      return { routes, error: null };
    } catch {
      return { routes: [], error: "network" };
    }
  });
