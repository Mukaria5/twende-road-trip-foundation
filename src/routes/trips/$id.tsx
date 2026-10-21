import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { supabase } from "@/integrations/supabase/client";
import { formatClock, formatElapsed, trackDistanceKm } from "@/lib/twende/geo";
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
import { formatDate as formatDateShort } from "@/lib/twende/format";

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
    record.actual_distance_km ?? (trackPoints.length ? trackDistanceKm(trackPoints) : null);
  const fuelRows = fuel.data ?? [];
  const fuelLitres = fuelRows.reduce((total, row) => total + Number(row.litres ?? 0), 0);
  const fuelCost = fuelRows.reduce((total, row) => total + Number(row.total_cost ?? 0), 0);
  const stopRows = stops.data ?? [];
  const noteRows = notes.data ?? [];
  const photoRows = photos.data ?? [];

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
        behalf. Started {formatDateShort(record.started_at ?? record.created_at)}
        {completedAt ? ` · finished ${formatClock(completedAt)}` : ""}.
        {formatElapsed((durationMinutes ?? 0) * 60_000) !== "0m"
          ? ` Total time ${formatElapsed((durationMinutes ?? 0) * 60_000)}.`
          : ""}
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

function Tally({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

