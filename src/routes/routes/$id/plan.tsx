import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Fuel } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { SectionHeader } from "@/components/twende/section-header";
import { CardSkeleton, ErrorState } from "@/components/twende/states";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { formatDistance } from "@/lib/twende/format";
import {
  formatKes,
  formatLitres,
  fuelCost,
  fuelLitres,
  plannedDistance,
  refuelStops,
  sumCosts,
  tankRangeKm,
  type TripType,
} from "@/lib/twende/fuel";
import { profileQuery, routeBySlugQuery, vehiclesQuery } from "@/lib/twende/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/routes/$id/plan")({
  head: () => ({
    meta: [
      { title: "Plan your trip — TWENDE" },
      {
        name: "description",
        content:
          "Plan a Kenyan road trip: distance, fuel needed, fuel cost and an estimated trip budget.",
      },
      { property: "og:title", content: "Plan your trip — TWENDE" },
      {
        property: "og:description",
        content: "Estimate distance, fuel and budget for your Kenyan road trip.",
      },
    ],
  }),
  component: PlanTripPage,
});

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function PlanTripPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();

  const { data, isLoading, isError, refetch } = useQuery(routeBySlugQuery(id));
  const { data: vehicles } = useQuery(vehiclesQuery(user?.id ?? null));
  const { data: profile } = useQuery(profileQuery(user?.id ?? null));

  const [tripType, setTripType] = useState<TripType>("return");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [travellers, setTravellers] = useState("2");
  const [fuelPrice, setFuelPrice] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [food, setFood] = useState("");
  const [activities, setActivities] = useState("");
  const [other, setOther] = useState("");
  const [notes, setNotes] = useState("");

  const vehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return undefined;
    return vehicles.find((item) => item.id === vehicleId) ?? vehicles[0];
  }, [vehicles, vehicleId]);

  const price = toNumber(fuelPrice) ?? profile?.fuel_price_per_litre ?? null;
  const distance = plannedDistance(data?.route.distance_km ?? null, tripType);
  const litres = fuelLitres(distance, vehicle?.fuel_consumption_km_per_litre);
  const fuel = fuelCost(litres, price);
  const range = tankRangeKm(vehicle?.fuel_tank_capacity, vehicle?.fuel_consumption_km_per_litre);
  const stops = refuelStops(distance, range);
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
      if (!user || !data) throw new Error("Sign in to save this trip.");
      const { data: inserted, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          route_id: data.route.id,
          vehicle_id: vehicle?.id ?? null,
          title: data.route.name,
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

  return (
    <AppShell>
      <Link
        to="/routes/$id"
        params={{ id }}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Back to route
      </Link>

      {isLoading && <CardSkeleton />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && !data && (
        <ErrorState title="Route not found" description="This road trip may have been removed." />
      )}

      {data && (
        <div className="space-y-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Plan your trip
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl">{data.route.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.route.starting_location} → {data.route.destination} ·{" "}
              {formatDistance(data.route.distance_km)} one way
            </p>
          </header>

          <section>
            <SectionHeader title="The drive" />
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
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

              <Field label="Planned distance">
                <p className="text-sm font-medium">{formatDistance(distance)}</p>
                <p className="text-xs text-muted-foreground">
                  Based on the route's curated distance estimate.
                </p>
              </Field>
            </div>
          </section>

          <section>
            <SectionHeader title="Fuel" description="Worked out from your vehicle's consumption." />
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
              {!user && !sessionLoading && (
                <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  <Link to="/auth" className="font-medium text-primary underline-offset-4 hover:underline">
                    Sign in
                  </Link>{" "}
                  to use your saved vehicle and save this plan.
                </p>
              )}

              {user && (!vehicles || vehicles.length === 0) && (
                <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  Add a vehicle with its fuel consumption on your{" "}
                  <Link to="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
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
                        {item.name ?? [item.make, item.model].filter(Boolean).join(" ") || "Vehicle"}
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

              {stops > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Your tank covers about {formatDistance(range)} — plan for at least {stops} refuel
                  {stops > 1 ? "s" : ""} along the way.
                </p>
              )}
              {litres == null && (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Fuel className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Fuel estimates need a vehicle consumption figure and a distance for this route.
                </p>
              )}
            </div>
          </section>

          <section>
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

          <section>
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
                <p className="mt-4 text-sm text-destructive">
                  Could not save this trip. Please try again.
                </p>
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
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={value}
      placeholder={placeholder ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
    />
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
