import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Compass,
  Crosshair,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";

import { AppShell } from "@/components/twende/app-shell";
import { PageHeader } from "@/components/twende/page-header";
import { RouteCard } from "@/components/twende/route-card";
import { SearchBar } from "@/components/twende/search-bar";
import { SectionHeader } from "@/components/twende/section-header";
import { CardGridSkeleton, ErrorState } from "@/components/twende/states";
import { searchPlaces, type GeoSearchError } from "@/lib/twende/geocode.functions";
import {
  MAP_PROVIDER,
  formatLatLng,
  type LatLngLiteral,
  type SelectedLocation,
  type UserLocationFix,
} from "@/lib/twende/map-providers";
import { routesQuery } from "@/lib/twende/queries";

/** Browser-only (Leaflet): loaded lazily so SSR never imports it. */
const MapView = lazy(() => import("@/components/twende/map-view"));

const title = "Map — TWENDE";
const description =
  "Interactive Kenya road map: search places, drop a pin and explore the country's drives.";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: MapPage,
});

type GeoStatus = "locating" | "denied" | "unavailable" | null;

function MapPage() {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationFix | null>(null);
  const [center, setCenter] = useState<LatLngLiteral>(MAP_PROVIDER.kenyaCenter);
  const [zoom, setZoom] = useState(MAP_PROVIDER.kenyaZoom);
  const [centerKey, setCenterKey] = useState("kenya");
  const [tilesLoading, setTilesLoading] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>(null);

  // Debounce input so we stay well inside the geocoder's usage policy.
  useEffect(() => {
    const trimmed = searchValue.trim();
    const timer = setTimeout(() => setDebouncedQuery(trimmed), MAP_PROVIDER.search.debounceMs);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const search = useQuery({
    queryKey: ["geosearch", debouncedQuery],
    queryFn: () => searchPlaces({ data: { query: debouncedQuery } }),
    enabled: debouncedQuery.length >= MAP_PROVIDER.search.minLength,
    staleTime: 60_000,
  });

  const showResults =
    debouncedQuery.length >= MAP_PROVIDER.search.minLength &&
    (search.isPending || search.data !== undefined);

  const flyTo = (point: LatLngLiteral, nextZoom: number) => {
    setCenter(point);
    setZoom(nextZoom);
    setCenterKey(`${point.lat.toFixed(5)},${point.lng.toFixed(5)},${nextZoom}`);
  };

  const choosePlace = (place: (typeof search.data)["results"][number]) => {
    setSearchValue(place.name);
    setDebouncedQuery("");
    setSelected({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      locality: place.locality,
    });
    flyTo({ lat: place.latitude, lng: place.longitude }, MAP_PROVIDER.detailZoom);
  };

  const onMapSelect = (point: LatLngLiteral) => {
    // A tapped pin is a coordinate only — never invent a place name for it.
    setSelected({
      latitude: point.lat,
      longitude: point.lng,
      name: null,
      locality: null,
    });
  };

  const locateMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fix: UserLocationFix = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        };
        setUserLocation(fix);
        flyTo(fix, MAP_PROVIDER.userLocationZoom);
        setGeoStatus(null);
      },
      (error) => {
        setGeoStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  };

  const { data, isLoading, isError, refetch } = useQuery(routesQuery);
  const featured = (data ?? []).slice(0, 6);

  return (
    <AppShell>
      <PageHeader
        title="Map"
        description="Search places, drop a pin and explore Kenya's roads."
      />

      <div className="relative">
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          label="Search places in Kenya"
          placeholder="Search places — try “Nanyuki”"
        />

        {showResults && (
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            {search.isPending && (
              <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Searching…
              </p>
            )}
            {search.isError && <p className="px-4 py-3 text-sm text-destructive">{searchErrorText("network")}</p>}
            {search.data && search.data.error && (
              <p className="px-4 py-3 text-sm text-destructive">{searchErrorText(search.data.error)}</p>
            )}
            {search.data && !search.data.error && search.data.results.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                No places found for “{debouncedQuery}”.
              </p>
            )}
            {search.data && !search.data.error && search.data.results.length > 0 && (
              <ul className="max-h-64 overflow-y-auto py-1">
                {search.data.results.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => choosePlace(place)}
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{place.name}</span>
                        {place.locality && (
                          <span className="block truncate text-xs text-muted-foreground">{place.locality}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-4">
        <button
          type="button"
          onClick={locateMe}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          {geoStatus === "locating" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="size-4" strokeWidth={1.75} aria-hidden />
          )}
          {userLocation ? "Update my location" : "Use my location"}
        </button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Optional — your location is only read when you tap this, and never stored.
        </p>
        {geoStatus === "denied" && (
          <p className="mt-1.5 text-xs text-destructive">
            Location permission was declined. Allow it in your browser settings to use this.
          </p>
        )}
        {geoStatus === "unavailable" && (
          <p className="mt-1.5 text-xs text-destructive">
            Your device couldn't provide a location right now.
          </p>
        )}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-muted">
        <div className="relative h-[62vh] min-h-[380px] sm:h-[70vh]">
          <ClientOnly fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <MapView
                center={center}
                centerKey={centerKey}
                zoom={zoom}
                selected={selected}
                userLocation={userLocation}
                onSelect={onMapSelect}
                onTilesLoading={setTilesLoading}
                onTilesError={setTilesFailed}
              />
            </Suspense>
          </ClientOnly>

          {tilesLoading && (
            <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Loading map…
            </div>
          )}
          {tilesFailed && (
            <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2 rounded-xl bg-destructive/95 px-3 py-2 text-xs text-destructive-foreground shadow-sm">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Map tiles failed to load — check your connection.
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {selected
          ? null
          : "Tap anywhere on the map to drop a pin."}
      </p>

      {selected && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {selected.name ?? "Dropped pin"}
              </p>
              {selected.locality && (
                <p className="truncate text-xs text-muted-foreground">{selected.locality}</p>
              )}
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {formatLatLng({ lat: selected.latitude, lng: selected.longitude })}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tap the map again to move the pin.
          </p>
        </div>
      )}

      <section className="mt-10">
        <SectionHeader
          title="Plan from the roads we know"
          description="Turn a place into a journey with our curated Kenyan drives."
          action={{ label: "See all", to: "/routes" }}
        />
        {isLoading && <CardGridSkeleton count={3} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function searchErrorText(error: GeoSearchError): string {
  if (error === "rate-limited") {
    return "Search is busy right now — try again in a moment.";
  }
  if (error === "provider") {
    return "The place search service isn't responding.";
  }
  return "Search couldn't reach the map service — check your connection.";
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted">
      <Compass className="size-6 animate-pulse text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <p className="text-sm text-muted-foreground">Loading map…</p>
    </div>
  );
}
