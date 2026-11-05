import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Flag, Fuel, MapPin, Route as RouteIcon } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { Field, NumberInput, Readout, SummaryRow } from "@/components/twende/planner-fields";
import { SectionHeader } from "@/components/twende/section-header";
import { CardSkeleton } from "@/components/twende/states";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  formatKes,
  formatLitres,
  fuelCost,
  fuelLitres,
  refuelStops,
  sumCosts,
  tankRangeKm,
  type TripType,
} from "@/lib/twende/fuel";
import { formatDistance, formatDuration } from "@/lib/twende/format";
import { type TripPoint } from "@/lib/twende/map-providers";
import { profileQuery, vehiclesQuery } from "@/lib/twende/queries";
import { calculateRoute } from "@/lib/twende/route.functions";
import { routeErrorText } from "@/lib/twende/route-messages";
import {
  decodeTripPoint,
  decodeWaypoints,
  encodeTripPoint,
  encodeWaypoints,
  pointLabel,
  toRoutePoint,
  tripSearchSchema,
} from "@/lib/twende/trip-params";
import { cn } from "@/lib/utils";

const title = "Plan a custom trip — TWENDE";
const description =
  "Turn the route you drew on the map into a full trip plan: real driving distance, fuel and budget.";

export const Route = createFileRoute("/plan")({
  validateSearch: tripSearchSchema,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PlanCustomTripPage,
});

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function PlanCustomTripPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();

  const start = useMemo(() => decodeTripPoint(searchParams.start), [searchParams.start]);
  const destination = useMemo(() => decodeTripPoint(searchParams.dest), [searchParams.dest]);
  const stops = useMemo(() => decodeWaypoints(searchParams.wp), [searchParams.wp]);
  const hasTrip = Boolean(start && destination);

  const [tripType, setTripType] = useState<TripType>("return");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [travellers, setTravellers] = useState("2");
  const [fuelPrice, setFuelPrice] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [food, setFood] = useState("");
  const [activities, setActivities] = useState("");
  const [other, setOther] = useState("");
  const [notes, setNotes] = useState("");

  const tripKey = hasTrip
    ? [encodeTripPoint(start!), encodeTripPoint(destination!), ...stops.map(encodeTripPoint)].join(
        ";",
      )
    : "";

  // Real driving distance and duration from the routing service — never guessed.
  const routeQuery = useQuery({
    queryKey: ["route", "plan", tripKey],
    queryFn: () =>
      calculateRoute({
        data: {
          start: toRoutePoint(start!),
          destination: toRoutePoint(destination!),
          waypoints: stops.map(toRoutePoint),
        },
      }),
    enabled: hasTrip,
    staleTime: 5 * 60_000,
  });

  const oneWay = routeQuery.data && !routeQuery.data.error ? routeQuery.data.routes[0] : null;
  const oneWayKm = oneWay?.distanceKm ?? null;
  const oneWayMinutes = oneWay?.durationMinutes ?? null;
  const distance =
    oneWayKm == null ? null : tripType === "return" ? oneWayKm * 2 : oneWayKm;
  const driveMinutes =
    oneWayMinutes == null ? null : tripType === "return" ? oneWayMinutes * 2 : oneWayMinutes;

  const { data: vehicles } = useQuery(vehiclesQuery(user?.id ?? null));
  const { data: profile } = useQuery(profileQuery(user?.id ?? null));

  const vehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return undefined;
    return vehicles.find((item) => item.id === vehicleId) ?? vehicles[0];
  }, [vehicles, vehicleId]);

  const price = toNumber(fuelPrice) ?? profile?.fuel_price_per_litre ?? null;
  const litres = fuelLitres(distance, vehicle?.fuel_consumption_km_per_litre);
  const fuel = fuelCost(litres, price);
  const range = tankRangeKm(vehicle?.fuel_tank_capacity, vehicle?.fuel_consumption_km_per_litre);
  const refuels = refuelStops(distance, range);
  const total = sumCosts([
    fuel,
    toNumber(accommodation),
    toNumber(food),
    toNumber(activities),
    toNumber(other),
  ]);

  const travellerCount = Math.max(1, Math.round(toNumber(travellers) ?? 1));

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !start || !destination) throw new Error("Sign in to save this trip.");
      const { data: inserted, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          vehicle_id: vehicle?.id ?? null,
          title: `${pointLabel(start)} → ${pointLabel(destination)}`,
          status: "planned",
          trip_type: tripType,
          travellers: travellerCount,
          planned_distance_km: distance,
          estimated_fuel_litres: litres,
          estimated_fuel_cost: fuel,
          estimated_accommodation_cost: toNumber(accommodation),
          estimated_food_cost: toNumber(food),
          estimated_activity_cost: toNumber(activities),
          estimated_other_cost: toNumber(other),
          estimated_total_cost: total,
          notes: notes.trim() === "" ? null : notes.trim(),
          start_location_name: start.name,
          start_latitude: start.latitude,
          start_longitude: start.longitude,
          destination_name: destination.name,
          destination_latitude: destination.latitude,
          destination_longitude: destination.longitude,
          waypoints: stops.map((stop) => ({
            name: stop.name,
            latitude: stop.latitude,
            longitude: stop.longitude,
          })),
          route_distance_km: oneWayKm,
          route_duration_minutes: oneWayMinutes,
          route_provider: "osrm",
          route_index: searchParams.route ?? 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      return inserted.id as string;
    },
    onSuccess: (tripId) => {
      void navigate({ to: "/trips/active/$id", params: { id: tripId } });
    },
  });

  if (!hasTrip) {
    return (
      <AppShell>
        <Link
          to="/map"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          Back to map
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <MapPin className="mx-auto size-6 text-primary" strokeWidth={1.6} aria-hidden />
          <h1 className="mt-3 text-xl font-semibold">No trip selected yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Pick a starting point and a destination on the map first, then come back here to plan
            the drive.
          </p>
          <Link
            to="/map"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open the map
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/map"
        search={{
          start: encodeTripPoint(start!),
          dest: encodeTripPoint(destination!),
          wp: encodeWaypoints(stops),
          route: searchParams.route,
        }}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Back to map
      </Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Plan your trip
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl">
          {pointLabel(start)} → {pointLabel(destination)}
        </h1>
      </header>

      <section className="mt-6">
        <SectionHeader title="The drive" />
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <PointRow label="Starting point" point={start!} tone="start" />
          <PointRow label="Destination" point={destination!} tone="dest" />
          {stops.map((stop, index) => (
            <PointRow
              key={`${stop.latitude}-${stop.longitude}-${index}`}
              label={`Stop ${index + 1}`}
              point={stop}
              tone="stop"
            />
          ))}

          <Field label="Trip type">
            <div className="flex gap-2">
              {(["one-way", "return"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTripType(option)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    tripType === option
                      ? "border-primary bg-accent text-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {option === "one-way" ? "One way" : "Return"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Travellers">
            <NumberInput value={travellers} onChange={setTravellers} min={1} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Readout label="Driving distance" value={formatDistance(distance)} />
            <Readout label="Time on the road" value={formatDuration(driveMinutes)} />
          </div>
          {routeQuery.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <RouteIcon className="size-4 animate-pulse" strokeWidth={1.75} aria-hidden />
              Measuring the real route…
            </p>
          )}
          {routeQuery.data?.error && (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              {routeErrorText(routeQuery.data.error)} Fuel estimates need the route distance, so
              they'll appear once it measures.
            </p>
          )}
          {!routeQuery.isLoading && !routeQuery.data?.error && (
            <p className="text-xs text-muted-foreground">
              {tripType === "return"
                ? "Real driving distance from the map's routing service, doubled for the return leg."
                : "Real driving distance from the map's routing service."}
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Fuel" description="Worked out from your vehicle's consumption." />
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          {!user && !sessionLoading && (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Link
                to="/auth"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>{" "}
              to use your saved vehicle and save this plan.
            </p>
          )}

          {user && (!vehicles || vehicles.length === 0) && (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Add a vehicle with its fuel consumption on your{" "}
              <Link
                to="/profile"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                profile
              </Link>{" "}
              to see fuel estimates.
            </p>
          )}

          {vehicles && vehicles.length > 1 && (
            <Field label="Vehicle">
              <select
                value={vehicle?.id ?? ""}
                onChange={(event) => setVehicleId(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {vehicles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name ?? ([item.make, item.model].filter(Boolean).join(" ") || "Vehicle")}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Fuel price (KES per litre)">
            <NumberInput
              value={fuelPrice}
              onChange={setFuelPrice}
              placeholder={
                profile?.fuel_price_per_litre ? String(profile.fuel_price_per_litre) : "e.g. 180"
              }
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Readout label="Fuel needed" value={formatLitres(litres)} />
            <Readout label="Fuel cost" value={formatKes(fuel)} />
          </div>

          {refuels > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              Your tank covers about {formatDistance(range)} — plan for at least {refuels} refuel
              {refuels > 1 ? "s" : ""} along the way.
            </p>
          )}
          {litres == null && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Fuel className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              Fuel estimates need a vehicle consumption figure and a measured route.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Budget" description="Your own estimates, in Kenyan shillings." />
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
          <Field label="Accommodation">
            <NumberInput value={accommodation} onChange={setAccommodation} placeholder="0" />
          </Field>
          <Field label="Food">
            <NumberInput value={food} onChange={setFood} placeholder="0" />
          </Field>
          <Field label="Activities & park fees">
            <NumberInput value={activities} onChange={setActivities} placeholder="0" />
          </Field>
          <Field label="Other">
            <NumberInput value={other} onChange={setOther} placeholder="0" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Anything you want to remember about this plan."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="mt-8 mb-4">
        <SectionHeader title="Trip summary" />
        <div className="rounded-2xl border border-border bg-card p-5">
          <dl className="space-y-2 text-sm">
            <SummaryRow label="Distance" value={formatDistance(distance)} />
            <SummaryRow label="Fuel" value={`${formatLitres(litres)} · ${formatKes(fuel)}`} />
            <SummaryRow label="Accommodation" value={formatKes(toNumber(accommodation))} />
            <SummaryRow label="Food" value={formatKes(toNumber(food))} />
            <SummaryRow label="Activities" value={formatKes(toNumber(activities))} />
            <SummaryRow label="Other" value={formatKes(toNumber(other))} />
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <p className="text-sm font-medium">Estimated total</p>
            <p className="text-2xl font-semibold tabular-nums">{formatKes(total)}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatKes(total / travellerCount)} per traveller ({travellerCount}).
          </p>

          {save.isError && (
            <p className="mt-4 text-sm text-destructive">Could not save this trip. Please try again.</p>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Start trip"}
            </button>
          ) : (
            <Link
              to="/auth"
              className="mt-5 block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign in to start this trip
            </Link>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function PointRow({
  label,
  point,
  tone,
}: {
  label: string;
  point: TripPoint;
  tone: "start" | "dest" | "stop";
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          tone === "start" && "border-forest/40 bg-forest/10",
          tone === "dest" && "border-primary/40 bg-accent",
          tone === "stop" && "border-border bg-muted",
        )}
      >
        {tone === "start" && <Flag className="size-3.5" strokeWidth={1.75} aria-hidden />}
        {tone === "dest" && <MapPin className="size-3.5" strokeWidth={1.75} aria-hidden />}
        {tone === "stop" && <span aria-hidden>·</span>}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{pointLabel(point)}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
        </p>
      </div>
    </div>
  );
}
