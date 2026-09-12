import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleStop,
  Gauge,
  Loader2,
  Locate,
  LogIn,
  Play,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/twende/app-shell";
import { EmptyState } from "@/components/twende/empty-state";
import { SectionHeader } from "@/components/twende/section-header";
import { CardSkeleton, ErrorState } from "@/components/twende/states";
import { TripRecorderActions } from "@/components/twende/trip-recorder-actions";
import { useSession } from "@/hooks/use-session";
import { useTripTracker } from "@/hooks/use-trip-tracker";
import { supabase } from "@/integrations/supabase/client";
import { formatElapsed } from "@/lib/twende/geo";
import { formatKes, formatLitres } from "@/lib/twende/fuel";
import {
  tripFuelQuery,
  tripNotesQuery,
  tripPhotosQuery,
  tripQuery,
  tripStopsQuery,
  tripTrackQuery,
} from "@/lib/twende/trip-queries";

export const Route = createFileRoute("/trips/active/$id")({
  head: () => ({
    meta: [
      { title: "Recording your trip — TWENDE" },
      { name: "description", content: "Record your Kenyan road trip as you drive it." },
      { property: "og:title", content: "Recording your trip — TWENDE" },
      {
        property: "og:description",
        content: "Record your Kenyan road trip as you drive it.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActiveTripPage,
});

function ActiveTripPage() {
  const { id } = Route.useParams();
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const trip = useQuery({ ...tripQuery(id), enabled: Boolean(user) });
  const track = useQuery({ ...tripTrackQuery(id), enabled: Boolean(user) });
  const stops = useQuery({ ...tripStopsQuery(id), enabled: Boolean(user) });
  const notes = useQuery({ ...tripNotesQuery(id), enabled: Boolean(user) });
  const fuel = useQuery({ ...tripFuelQuery(id), enabled: Boolean(user) });
  const photos = useQuery({ ...tripPhotosQuery(id), enabled: Boolean(user) });

  const lastStoredPoint = useMemo(() => {
    const points = track.data ?? [];
    const last = points[points.length - 1];
    if (!last) return null;
    return {
      latitude: Number(last.latitude),
      longitude: Number(last.longitude),
      accuracy: last.accuracy,
      recorded_at: new Date(last.recorded_at).getTime(),
    };
  }, [track.data]);

  const tracker = useTripTracker({
    tripId: id,
    userId: user?.id ?? null,
    initialDistanceKm: trip.data?.actual_distance_km ?? 0,
    initialLastPoint: lastStoredPoint,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startedAt = trip.data?.started_at ? new Date(trip.data.started_at).getTime() : null;
  const elapsedMs = startedAt ? Math.max(0, now - startedAt) : 0;

  const startTrip = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trips")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trip", id] });
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      tracker.start();
    },
    onError: () => toast.error("Couldn't start the trip. Try again."),
  });

  const [confirmFinish, setConfirmFinish] = useState(false);

  const finishTrip = useMutation({
    mutationFn: async () => {
      await tracker.flush();
      tracker.stop();
      const litres = (fuel.data ?? []).reduce((total, row) => total + Number(row.litres ?? 0), 0);
      const cost = (fuel.data ?? []).reduce((total, row) => total + Number(row.total_cost ?? 0), 0);
      const { error } = await supabase
        .from("trips")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          actual_distance_km: Number(tracker.distanceKm.toFixed(2)),
          actual_duration_minutes: Math.round(elapsedMs / 60_000),
          actual_fuel_litres: litres > 0 ? litres : null,
          actual_fuel_cost: cost > 0 ? cost : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["trip", id] });
      toast.success("Trip saved");
      void navigate({ to: "/trips/$id", params: { id } });
    },
    onError: () => toast.error("Couldn't finish the trip. Try again."),
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
          title="Sign in to record this trip"
          description="Your trips, stops and photos are private to your account."
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
  const isCompleted = record.status === "completed";
  const isRecording = tracker.status === "tracking";

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
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Distance is measured from your phone's location while this screen stays open. Keep the
        screen on to keep recording — and let a passenger handle the phone while driving.
      </p>

      {isCompleted && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="font-medium">This trip is already finished.</p>
          <Link
            to="/trips/$id"
            params={{ id }}
            className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            View trip record
          </Link>
        </div>
      )}

      {!isCompleted && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric
              icon={Gauge}
              label="Distance driven"
              value={`${tracker.distanceKm.toFixed(1)} km`}
            />
            <Metric icon={Timer} label="Time on the road" value={formatElapsed(elapsedMs)} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
            <Locate
              className={`size-4 ${isRecording ? "text-primary" : "text-muted-foreground"}`}
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="font-medium">
              {isRecording
                ? "Recording your location"
                : tracker.status === "requesting"
                  ? "Waiting for a GPS fix…"
                  : "Location recording is off"}
            </span>
            {tracker.accuracy != null && isRecording && (
              <span className="text-muted-foreground">±{Math.round(tracker.accuracy)} m</span>
            )}
          </div>

          {tracker.message && (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {tracker.message}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={() => {
                  if (!record.started_at) startTrip.mutate();
                  else tracker.start();
                }}
                disabled={startTrip.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {startTrip.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="size-4" strokeWidth={1.75} aria-hidden />
                )}
                {record.started_at ? "Resume recording" : "Start trip"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => tracker.stop()}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <CircleStop className="size-4" strokeWidth={1.75} aria-hidden />
                Pause recording
              </button>
            )}

            {record.started_at && (
              <button
                type="button"
                onClick={() => setConfirmFinish(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Finish trip
              </button>
            )}
          </div>

          {confirmFinish && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <p className="font-medium">Finish and save this trip?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll save {tracker.distanceKm.toFixed(1)} km over {formatElapsed(elapsedMs)}.
                Recording stops for good once you finish.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => finishTrip.mutate()}
                  disabled={finishTrip.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {finishTrip.isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  Finish trip
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmFinish(false)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Keep driving
                </button>
              </div>
            </div>
          )}

          {record.started_at && (
            <section className="mt-10">
              <SectionHeader
                title="Record as you go"
                description="Stops, photos, notes and fuel are saved to this trip."
              />
              <TripRecorderActions tripId={id} userId={user.id} lastFix={tracker.lastFix} />
            </section>
          )}
        </>
      )}

      <section className="mt-10">
        <SectionHeader title="Recorded so far" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Tally label="Stops" value={String((stops.data ?? []).length)} />
          <Tally label="Photos" value={String((photos.data ?? []).length)} />
          <Tally label="Notes" value={String((notes.data ?? []).length)} />
          <Tally
            label="Fuel bought"
            value={`${formatLitres(
              (fuel.data ?? []).reduce((total, row) => total + Number(row.litres ?? 0), 0) || null,
            )} · ${formatKes(
              (fuel.data ?? []).reduce((total, row) => total + Number(row.total_cost ?? 0), 0) ||
                null,
            )}`}
          />
        </div>
      </section>
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

function Tally({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
