import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Compass,
  Crosshair,
  Flag,
  Loader2,
  MapPin,
  Route as RouteIcon,
  Trash2,
  X,
} from "lucide-react";
import { Suspense, lazy, useEffect, useRef, useState } from "react";

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
  type GeoPlace,
  type LatLngLiteral,
  type SelectedLocation,
  type TripPoint,
  type UserLocationFix,
} from "@/lib/twende/map-providers";
import { routesQuery } from "@/lib/twende/queries";
import { calculateRoute } from "@/lib/twende/route.functions";
import {
  decodeTripPoint,
  decodeWaypoints,
  encodeTripPoint,
  encodeWaypoints,
  pointLabel,
  toRoutePoint,
  tripSearchSchema,
} from "@/lib/twende/trip-params";
import { formatDistance, formatDuration } from "@/lib/twende/format";
import { cn } from "@/lib/utils";

/** Browser-only (Leaflet): loaded lazily so SSR never imports it. */
const MapView = lazy(() => import("@/components/twende/map-view"));

const title = "Map — TWENDE";
const description =
  "Interactive Kenya road map: pick a start and destination, see the real driving route and plan the trip.";

export const Route = createFileRoute("/map")({
  validateSearch: tripSearchSchema,
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
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationFix | null>(null);
  const [center, setCenter] = useState<LatLngLiteral>(MAP_PROVIDER.kenyaCenter);
  const [zoom, setZoom] = useState<number>(MAP_PROVIDER.kenyaZoom);
  const [centerKey, setCenterKey] = useState("kenya");
  const [tilesLoading, setTilesLoading] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const [resultsDismissed, setResultsDismissed] = useState(false);

  // A selection carried over from the planner restores the trip in progress.
  const [start, setStart] = useState<TripPoint | null>(() => decodeTripPoint(searchParams.start));
  const [destination, setDestination] = useState<TripPoint | null>(() =>
    decodeTripPoint(searchParams.dest),
  );
  const [stops, setStops] = useState<TripPoint[]>(() => decodeWaypoints(searchParams.wp));
  const [routeIndex, setRouteIndex] = useState(searchParams.route ?? 0);

  const tripKey =
    start && destination
      ? [encodeTripPoint(start), encodeTripPoint(destination), ...stops.map(encodeTripPoint)].join(
          ";",
        )
      : "";

  // Debounce input so we stay well inside the geocoder's usage policy.
  // A search result fills the input too — don't re-search the chosen place.
  useEffect(() => {
    const trimmed = searchValue.trim();
    if (selected?.name === trimmed) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
      setResultsDismissed(false);
    }, MAP_PROVIDER.search.debounceMs);
    return () => clearTimeout(timer);
  }, [searchValue, selected]);

  const search = useQuery({
    queryKey: ["geosearch", debouncedQuery],
    queryFn: () => searchPlaces({ data: { query: debouncedQuery } }),
    enabled: debouncedQuery.length >= MAP_PROVIDER.search.minLength,
    staleTime: 60_000,
  });

  const baseShowResults =
    debouncedQuery.length >= MAP_PROVIDER.search.minLength &&
    (search.isPending || search.data !== undefined);
  const showResults = baseShowResults && !resultsDismissed;

  // Close the results sheet when tapping/clicking outside it, or on Escape.
  useEffect(() => {
    if (!baseShowResults || resultsDismissed) return;
    const onPointerDown = (event: PointerEvent) => {
      const box = searchBoxRef.current;
      if (box && event.target instanceof Node && !box.contains(event.target)) {
        setResultsDismissed(true);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResultsDismissed(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [baseShowResults, resultsDismissed]);

  // Real driving route between the chosen points — recalculated whenever the
  // selection changes. Empty while either endpoint is missing.
  const routeQuery = useQuery({
    queryKey: ["route", tripKey],
    queryFn: () =>
      calculateRoute({
        data: {
          start: toRoutePoint(start!),
          destination: toRoutePoint(destination!),
          waypoints: stops.map(toRoutePoint),
          alternatives: true,
        },
      }),
    enabled: Boolean(start && destination),
    staleTime: 5 * 60_000,
  });

  // A new selection invalidates the previously chosen route option.
  useEffect(() => {
    setRouteIndex(0);
  }, [tripKey]);

  const flyTo = (point: LatLngLiteral, nextZoom: number) => {
    setCenter(point);
    setZoom(nextZoom);
    setCenterKey(`${point.lat.toFixed(5)},${point.lng.toFixed(5)},${nextZoom}`);
  };

  const choosePlace = (place: GeoPlace) => {
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

  const selectedAsTripPoint = (): TripPoint | null => {
    if (!selected) return null;
    return {
      name: selected.name,
      locality: selected.locality,
      latitude: selected.latitude,
      longitude: selected.longitude,
    };
  };

  const setAsStart = () => {
    const point = selectedAsTripPoint();
    if (!point) return;
    setStart(point);
    setSelected(null);
  };

  const setAsDestination = () => {
    const point = selectedAsTripPoint();
    if (!point) return;
    setDestination(point);
    setSelected(null);
  };

  const addAsStop = () => {
    const point = selectedAsTripPoint();
    if (!point) return;
    setStops((current) => [...current, point]);
    setSelected(null);
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

  const startFromMyLocation = () => {
    if (!userLocation) return;
    setStart({ name: null, locality: null, latitude: userLocation.lat, longitude: userLocation.lng });
  };

  const planThisTrip = () => {
    if (!start || !destination) return;
    void navigate({
      to: "/plan",
      search: {
        start: encodeTripPoint(start),
        dest: encodeTripPoint(destination),
        wp: encodeWaypoints(stops),
        route: routeIndex,
      },
    });
  };

  const clearTrip = () => {
    setStart(null);
    setDestination(null);
    setStops([]);
    setRouteIndex(0);
  };

  const routes = routeQuery.data && !routeQuery.data.error ? routeQuery.data.routes : [];
  const selectedRoute = routes[Math.min(routeIndex, routes.length - 1)] ?? null;

  const { data, isLoading, isError, refetch } = useQuery(routesQuery);
  const featured = (data ?? []).slice(0, 6);

  return (
    <AppShell>
      <PageHeader
        title="Map"
        description="Pick a start and destination, then plan the drive."
      />

      <div ref={searchBoxRef} className="relative z-[1100]">
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
        {userLocation && !start && (
          <button
            type="button"
            onClick={startFromMyLocation}
            className="inline-flex items-center gap-2 rounded-full border border-forest/40 bg-forest/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-forest/20"
          >
            <Flag className="size-4" strokeWidth={1.75} aria-hidden />
            Start here
          </button>
        )}
      </div>
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
                start={start}
                destination={destination}
                stops={stops}
                routes={routes}
                selectedRouteIndex={routeIndex}
                fitKey={tripKey ? `${tripKey}|${routes.length}|${routeIndex}` : ""}
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
        {selected ? null : "Tap anywhere on the map to drop a pin."}
      </p>

      {selected && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
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
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Clear selection"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={setAsStart}
              className="rounded-full border border-forest/40 bg-forest/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-forest/20"
            >
              {start ? "Replace starting point" : "Set as starting point"}
            </button>
            <button
              type="button"
              onClick={setAsDestination}
              className="rounded-full border border-primary/40 bg-accent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/70"
            >
              {destination ? "Replace destination" : "Set as destination"}
            </button>
            {start && destination && (
              <button
                type="button"
                onClick={addAsStop}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Add as stop
              </button>
            )}
          </div>
        </div>
      )}

      {(start || destination) && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
              <RouteIcon className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
              Your trip
            </h2>
            <button
              type="button"
              onClick={clearTrip}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
              Clear trip
            </button>
          </div>

          <PointRow label="Starting point" point={start} tone="start" />
          <PointRow label="Destination" point={destination} tone="dest" />
          {stops.map((stop, index) => (
            <PointRow
              key={`${stop.latitude}-${stop.longitude}-${index}`}
              label={`Stop ${index + 1}`}
              point={stop}
              tone="stop"
              onRemove={() => setStops((current) => current.filter((_, i) => i !== index))}
            />
          ))}

          {!destination && start && (
            <p className="mt-3 text-xs text-muted-foreground">
              Now pick a destination — search above or tap the map.
            </p>
          )}
          {!start && destination && (
            <p className="mt-3 text-xs text-muted-foreground">
              Now pick a starting point — search above, tap the map or use your location.
            </p>
          )}

          {start && destination && (
            <div className="mt-4 border-t border-border pt-4">
              {routeQuery.isPending && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Calculating the driving route…
                </p>
              )}
              {(routeQuery.isError || routeQuery.data?.error) && (
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-sm text-destructive">
                    {routeErrorText(routeQuery.data?.error ?? "network")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void routeQuery.refetch()}
                    className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
              {routes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2" role="radiogroup" aria-label="Route options">
                    {routes.map((route, index) => (
                      <button
                        key={index}
                        type="button"
                        role="radio"
                        aria-checked={index === routeIndex}
                        onClick={() => setRouteIndex(index)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                          index === routeIndex
                            ? "border-primary bg-accent"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <span className="font-medium">
                          {routes.length > 1 ? `Route ${index + 1}` : "Driving route"}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatDistance(route.distanceKm)} · ~
                          {formatDuration(route.durationMinutes)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {routes.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Alternatives come from the routing provider — tap one to switch.
                    </p>
                  )}
                  {selectedRoute && (
                    <button
                      type="button"
                      onClick={planThisTrip}
                      className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Plan This Trip · {formatDistance(selectedRoute.distanceKm)}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
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

function PointRow({
  label,
  point,
  tone,
  onRemove,
}: {
  label: string;
  point: TripPoint | null;
  tone: "start" | "dest" | "stop";
  onRemove?: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground",
          tone === "start" && "bg-forest",
          tone === "dest" && "bg-primary",
          tone === "stop" && "size-5 bg-accent-foreground text-[9px]",
        )}
      >
        {tone === "start" ? "A" : tone === "dest" ? "B" : ""}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">
          {point ? pointLabel(point) : "Not set yet"}
        </p>
      </div>
      {point && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}
    </div>
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

function routeErrorText(error: "network" | "rate-limited" | "provider" | "unreachable" | "invalid"): string {
  if (error === "rate-limited") {
    return "The routing service is busy right now — try again in a moment.";
  }
  if (error === "provider") {
    return "The routing service isn't responding.";
  }
  if (error === "unreachable") {
    return "No driving route was found between these points — try moving one of them onto a road.";
  }
  if (error === "invalid") {
    return "One of the selected points isn't on a drivable road — adjust it on the map.";
  }
  return "The route couldn't reach the routing service — check your connection.";
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted">
      <Compass className="size-6 animate-pulse text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <p className="text-sm text-muted-foreground">Loading map…</p>
    </div>
  );
}
