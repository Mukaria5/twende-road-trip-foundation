import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MAP_PROVIDER, type GeoPlace } from "./map-providers";

export type GeoSearchError = "network" | "rate-limited" | "provider";

interface GeoSearchResponse {
  results: GeoPlace[];
  error: GeoSearchError | null;
}

const searchInput = z.object({ query: z.string().trim().min(2).max(120) });

interface NominatimPlace {
  place_id?: number;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}

/**
 * Location search, proxied through a server function so the geocoding provider
 * receives a proper identifying User-Agent (browser fetch cannot set one) and
 * stays replaceable via NOMINATIM_BASE_URL / NOMINATIM_USER_AGENT. Provider
 * failures and rate limits come back as a typed status the UI can explain;
 * the client debounces so we stay well inside Nominatim's 1 req/s policy.
 */
export const searchPlaces = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => searchInput.parse(input))
  .handler(async ({ data }): Promise<GeoSearchResponse> => {
    const base = (
      process.env["NOMINATIM_BASE_URL"] || "https://nominatim.openstreetmap.org"
    ).replace(/\/+$/, "");
    const userAgent =
      process.env["NOMINATIM_USER_AGENT"] ||
      "TWENDE/1.0 (Kenya road-trip companion app; https://twende-kenya-trips.lovable.app)";

    const params = new URLSearchParams({
      q: data.query,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(MAP_PROVIDER.search.limit),
      countrycodes: MAP_PROVIDER.search.countryCode,
    });

    try {
      const response = await fetch(`${base}/search?${params.toString()}`, {
        headers: { "User-Agent": userAgent, "Accept-Language": "en" },
        signal: AbortSignal.timeout(8_000),
      });

      if (response.status === 429 || response.status === 503) {
        return { results: [], error: "rate-limited" };
      }
      if (!response.ok) {
        return { results: [], error: "provider" };
      }

      const payload = (await response.json()) as NominatimPlace[];
      if (!Array.isArray(payload)) return { results: [], error: "provider" };

      const results: GeoPlace[] = [];
      for (const item of payload) {
        const latitude = Number.parseFloat(item.lat ?? "");
        const longitude = Number.parseFloat(item.lon ?? "");
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

        const name =
          item.name?.trim() || item.display_name?.split(",")[0]?.trim() || "";
        if (!name) continue;

        const address = item.address ?? {};
        const locality =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          address.state ||
          null;

        results.push({
          id: String(item.place_id ?? `${latitude},${longitude}`),
          name,
          locality,
          latitude,
          longitude,
        });
      }
      return { results, error: null };
    } catch {
      return { results: [], error: "network" };
    }
  });
