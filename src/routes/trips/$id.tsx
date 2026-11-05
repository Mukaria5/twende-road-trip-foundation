import { Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Fuel,
  Gauge,
  LogIn,
  MapPinned,
  NotebookPen,
  Play,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { EmptyState } from "@/components/twende/empty-state";
import { MapPlaceholder } from "@/components/twende/map-placeholder";
import { SectionHeader } from "@/components/twende/section-header";
import { CardSkeleton, ErrorState } from "@/components/twende/states";
import { useSession } from "@/hooks/use-session";

import { formatClock, trackDistanceKm } from "@/lib/twende/geo";
import { formatKes, formatLitres } from "@/lib/twende/fuel";
import { formatDate, formatDistance, formatDuration } from "@/lib/twende/format";
import {
  tripFuelQuery,
  tripNotesQuery,
  tripPhotosQuery,
  tripQuery,
  tripStopsQuery,
  tripTrackQuery,
} from "@/lib/twende/trip-queries";
import { calculateRoute } from "@/lib/twende/route.functions";
import { routeErrorText } from "@/lib/twende/route-messages";
import type { TripPoint } from "@/lib/twende/map-providers";
import {
  encodeTripPoint,
  encodeWaypoints,
  pointLabel,
  toRoutePoint,
} from "@/lib/twende/trip-params";

/** Browser-only (Leaflet): loaded lazily so SSR never imports it. */
const MapView = lazy(() => import("@/components/twende/map-view"));


export const Route = createFileRoute("/trips/$id")({
  head: () => ({
    meta: [
      { title: "Trip record — TWENDE" },
      { name: "description", content: "A recorded Kenyan road trip and its details." },
      { property: "og:title", content: "Trip record — TWENDE" },
      {
        property: "og:description",
        content: "A recorded Kenyan road trip and its details.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TripDetailPage,
});

function TripDetailPage() {
  const { id } = Route.useParams();
  const { user, loading } = useSession();

  const trip = useQuery({ ...tripQuery(id), enabled: Boolean(user) });
  const track = useQuery({ ...tripTrackQuery(id), enabled: Boolean(user) });
  const stops = useQuery({ ...tripStopsQuery(id), enabled: Boolean(user) });
  const notes = useQuery({ ...tripNotesQuery(id), enabled: Boolean(user) });
  const fuel = useQuery({ ...tripFuelQuery(id), enabled: Boolean(user) });
  const photos = useQuery({ ...tripPhotosQuery(id), enabled: Boolean(user) });

  // The route planned before setting off — re-drawn from the persisted points.
  const plannedRoute = useQuery({
    queryKey: ["trip-planned-route", id],
    queryFn: () =>
      calculateRoute({
        data: {
          start: {
            latitude: trip.data!.start_latitude!,
            longitude: trip.data!.start_longitude!,
          },
          destination: {
            latitude: trip.data!.destination_latitude!,
            longitude: trip.data!.destination_longitude!,
          },
          waypoints: (Array.isArray(trip.data!.waypoints) ? trip.data!.waypoints : [])
            .filter(
              (point) =>
                typeof point?.latitude === "number" && typeof point?.longitude === "number",
            )
            .map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
        },
      }),
    enabled: Boolean(trip.data?.start_latitude != null && trip.data?.destination_latitude != null),
    staleTime: 5 * 60_000,
  });

  if (loading) {
    return (
      <AppShell>
        <CardSkeleton />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <EmptyState
          icon={LogIn}
          title="Sign in to see this trip"
          description="Trips are private to the account that recorded them."
          action={{ label: "Sign in", to: "/auth" }}
        />
      </AppShell>
    );
  }

  if (trip.isLoading) {
    return (
      <AppShell>
        <CardSkeleton />
      </AppShell>
    );
  }

  if (trip.isError || !trip.data) {
    return (
      <AppShell>
        <ErrorState
          title="Trip not found"
          description="This trip doesn't exist or isn't yours."
          onRetry={() => void trip.refetch()}
        />
      </AppShell>
    );
  }

  const record = trip.data;
  const isActive = record.status === "active";
  const startedAt = record.started_at ? new Date(record.started_at).getTime() : null;
  const completedAt = record.completed_at ? new Date(record.completed_at).getTime() : null;
  const durationMinutes =
    record.actual_duration_minutes ??
    (startedAt && completedAt ? Math.round((completedAt - startedAt) / 60_000) : null);
  const trackPoints = track.data ?? [];
  const measuredDistance =
    record.actual_distance_km ??
    (trackPoints.length
      ? trackDistanceKm(
          trackPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            accuracy: point.accuracy,
            recorded_at: new Date(point.recorded_at).getTime(),
          })),
        )
      : null);

  const fuelRows = fuel.data ?? [];
  const fuelLitres = fuelRows.reduce((total, row) => total + Number(row.litres ?? 0), 0);
  const fuelCost = fuelRows.reduce((total, row) => total + Number(row.total_cost ?? 0), 0);
  const stopRows = stops.data ?? [];
  const noteRows = notes.data ?? [];
  const photoRows = photos.data ?? [];

  // Planned-route view model: only when the trip carried real map points.
  const startPoint =
    record.start_latitude != null && record.start_longitude != null
      ? {
          name: record.start_location_name,
          locality: null,
          latitude: record.start_latitude,
          longitude: record.start_longitude,
        }
      : null;
  const destinationPoint =
    record.destination_latitude != null && record.destination_longitude != null
      ? {
          name: record.destination_name,
          locality: null,
          latitude: record.destination_latitude,
          longitude: record.destination_longitude,
        }
      : null;
  const plannedStops: TripPoint[] = (Array.isArray(record.waypoints) ? record.waypoints : [])
    .filter(
      (point) => typeof point?.latitude === "number" && typeof point?.longitude === "number",
    )
    .map((point) => ({
      name: typeof point?.name === "string" ? point.name : null,
      locality: null,
      latitude: point.latitude,
      longitude: point.longitude,
    }));
  const plannedRoutes =
    plannedRoute.data && !plannedRoute.data.error ? plannedRoute.data.routes : [];
  const plannedDistanceKm = plannedRoutes[0]?.distanceKm ?? record.route_distance_km ?? null;
  const plannedDurationMinutes =
    plannedRoutes[0]?.durationMinutes ?? record.route_duration_minutes ?? null;
  const tripCenter = startPoint && destinationPoint
    ? {
        lat: (startPoint.latitude + destinationPoint.latitude) / 2,
        lng: (startPoint.longitude + destinationPoint.longitude) / 2,
      }
    : null;

  return (
    <AppShell>
      <Link
        to="/trips"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        My trips
      </Link>

      <h1 className="text-3xl md:text-4xl">{record.title ?? "Your road trip"}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
          {formatDate(record.started_at ?? record.created_at)}
        </span>
        {record.travellers > 1 && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" strokeWidth={1.75} aria-hidden />
            {record.travellers} travellers
          </span>
        )}
        <span className="capitalize">{record.trip_type === "return" ? "Return trip" : "One-way"}</span>
      </p>

      {isActive && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="font-medium">This trip is still being recorded.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Head back to the recorder to continue tracking distance or finish the journey.
          </p>
          <Link
            to="/trips/active/$id"
            params={{ id }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Play className="size-4" strokeWidth={1.75} aria-hidden />
            Resume recording
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric
          icon={Gauge}
          label="Distance driven"
          value={measuredDistance != null ? formatDistance(measuredDistance) : "—"}
        />
        <Metric
          icon={MapPinned}
          label="Time on the road"
          value={durationMinutes != null ? formatDuration(durationMinutes) : "—"}
        />
        <Metric
          icon={Fuel}
          label="Fuel recorded"
          value={fuelLitres > 0 ? formatLitres(fuelLitres) : "—"}
        />
        <Metric
          icon={Fuel}
          label="Fuel spent"
          value={fuelCost > 0 ? formatKes(fuelCost) : "—"}
        />
      </div>

      {(record.planned_distance_km != null ||
        record.estimated_fuel_litres != null ||
        record.estimated_total_cost != null) && (
        <section className="mt-8">
          <SectionHeader title="Plan vs. reality" description="What you estimated before setting off." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Tally
              label="Planned distance"
              value={
                record.planned_distance_km != null
                  ? formatDistance(record.planned_distance_km)
                  : "—"
              }
              hint={
                measuredDistance != null && record.planned_distance_km != null
                  ? `${measuredDistance >= record.planned_distance_km ? "+" : ""}${(
                      measuredDistance - record.planned_distance_km
                    ).toFixed(0)} km vs plan`
                  : undefined
              }
            />
            <Tally
              label="Estimated fuel"
              value={record.estimated_fuel_litres != null ? formatLitres(record.estimated_fuel_litres) : "—"}
              hint={
                fuelLitres > 0 && record.estimated_fuel_litres != null
                  ? `${formatLitres(fuelLitres)} actually recorded`
                  : undefined
              }
            />
            <Tally
              label="Estimated fuel cost"
              value={record.estimated_fuel_cost != null ? formatKes(record.estimated_fuel_cost) : "—"}
            />
            <Tally
              label="Estimated trip budget"
              value={record.estimated_total_cost != null ? formatKes(record.estimated_total_cost) : "—"}
              hint={record.travellers > 1 && record.estimated_total_cost != null
                ? `${formatKes(record.estimated_total_cost / record.travellers)} per person`
                : undefined}
            />
          </div>
        </section>
      )}

      {startPoint && destinationPoint && tripCenter && (
        <section className="mt-8">
          <SectionHeader
            title="Planned route"
            description="The route you planned before setting off."
          />
          <div className="rounded-2xl border border-border bg-card p-4">
            <ul className="space-y-1.5 text-sm">
              <li>
                <span className="font-semibold text-forest">Start:</span>{" "}
                {pointLabel(startPoint)}
              </li>
              {plannedStops.map((stop, index) => (
                <li key={`${stop.latitude}-${stop.longitude}-${index}`}>
                  <span className="text-muted-foreground">Stop {index + 1}:</span>{" "}
                  {pointLabel(stop)}
                </li>
              ))}
              <li>
                <span className="font-semibold text-primary">Destination:</span>{" "}
                {pointLabel(destinationPoint)}
              </li>
            </ul>
            <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <div>
                <dt>Planned driving distance</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {formatDistance(plannedDistanceKm)}
                </dd>
              </div>
              <div>
                <dt>Planned time on the road</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {formatDuration(plannedDurationMinutes)}
                </dd>
              </div>
            </dl>
            {plannedRoute.data?.error && (
              <p className="mt-2 text-xs text-muted-foreground">
                {routeErrorText(plannedRoute.data.error)} The planned points are still shown below.
              </p>
            )}
            <Link
              to="/map"
              search={{
                start: encodeTripPoint(startPoint),
                dest: encodeTripPoint(destinationPoint),
                wp: encodeWaypoints(plannedStops),
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Open on the map
            </Link>
          </div>
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-muted">
            <div className="relative h-[46vh] min-h-[300px]">
              <ClientOnly
                fallback={
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading map…
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Loading map…
                    </div>
                  }
                >
                  <MapView
                    center={tripCenter}
                    centerKey={`trip-${record.id}`}
                    zoom={6}
                    selected={null}
                    userLocation={null}
                    onSelect={() => {}}
                    onTilesLoading={() => {}}
                    onTilesError={() => {}}
                    start={startPoint}
                    destination={destinationPoint}
                    stops={plannedStops}
                    routes={plannedRoutes}
                    fitKey={`trip-${record.id}-${plannedRoutes.length}`}
                  />
                </Suspense>
              </ClientOnly>
            </div>
          </div>
        </section>
      )}

      <section className="mt-8">
        <SectionHeader
          title="Route taken"
          description={
            trackPoints.length > 0
              ? `${trackPoints.length} location points recorded from your phone.`
              : "No location points were recorded for this trip."
          }
        />
        <MapPlaceholder label="Recorded route" />
      </section>

      <section className="mt-8">
        <SectionHeader title={`Stops (${stopRows.length})`} />
        {stopRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stops were recorded.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-6">
            {stopRows.map((stop) => (
              <li key={stop.id} className="relative">
                <span className="absolute -left-[2.1rem] top-3 flex size-7 items-center justify-center rounded-full border border-border bg-card">
                  <MapPinned className="size-3.5 text-primary" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{stop.name}</p>
                    {stop.stop_type && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-foreground">
                        {stop.stop_type}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatClock(stop.recorded_at)}
                    </span>
                  </div>
                  {stop.note && (
                    <p className="mt-2 text-sm text-muted-foreground">{stop.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title={`Fuel purchases (${fuelRows.length})`} />
        {fuelRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fuel purchases were recorded.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fuelRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium">
                  {formatLitres(Number(row.litres))}
                  {row.total_cost != null ? ` · ${formatKes(Number(row.total_cost))}` : ""}
                </p>
                {row.price_per_litre != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatKes(Number(row.price_per_litre))} per litre
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{formatClock(row.recorded_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title={`Photos (${photoRows.length})`} />
        {photos.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading photos…</p>
        ) : photoRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos were attached to this trip.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoRows.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                {photo.signed_url ? (
                  <img
                    src={photo.signed_url}
                    alt={photo.caption ?? "Trip photo"}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                    <Camera className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                  </div>
                )}
                {photo.caption && (
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title={`Notes (${noteRows.length})`} />
        {noteRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes were recorded.</p>
        ) : (
          <ul className="space-y-3">
            {noteRows.map((note) => (
              <li
                key={note.id}
                className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground"
              >
                <span className="mb-1 flex items-center gap-1.5 text-xs">
                  <NotebookPen className="size-3.5" strokeWidth={1.75} aria-hidden />
                  {formatClock(note.recorded_at)}
                </span>
                <span className="text-foreground">{note.body}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Distance is measured locally from your phone's GPS points — nothing is estimated on your
        behalf.

      </p>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="size-5 text-primary" strokeWidth={1.6} aria-hidden />
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Tally({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

