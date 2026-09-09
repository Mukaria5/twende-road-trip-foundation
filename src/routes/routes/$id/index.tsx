import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Clock, Fuel, MapPin, Mountain, Wallet } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { JourneyTimeline } from "@/components/twende/journey-timeline";
import { MapPlaceholder } from "@/components/twende/map-placeholder";
import { SaveRouteButton } from "@/components/twende/save-route-button";
import { SectionHeader } from "@/components/twende/section-header";
import { ShareButton } from "@/components/twende/share-button";
import { CardSkeleton, ErrorState } from "@/components/twende/states";
import { formatDistance, formatDuration } from "@/lib/twende/format";
import { routeImage } from "@/lib/twende/images";
import { routeBySlugQuery } from "@/lib/twende/queries";

export const Route = createFileRoute("/routes/$id/")({
  head: () => ({
    meta: [
      { title: "Route details — TWENDE" },
      {
        name: "description",
        content: "Distance, drive time, stops and planning details for a Kenyan road trip.",
      },
      { property: "og:title", content: "Route details — TWENDE" },
      {
        property: "og:description",
        content: "Distance, drive time, stops and planning details for a Kenyan road trip.",
      },
    ],
  }),
  component: RouteDetailPage,
});

function RouteDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, isError, refetch } = useQuery(routeBySlugQuery(id));

  return (
    <AppShell>
      <Link
        to="/routes"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        All road trips
      </Link>

      {isLoading && <CardSkeleton />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && !data && (
        <ErrorState
          title="Route not found"
          description="This road trip may have been renamed or removed."
        />
      )}

      {data && (
        <article className="space-y-10">
          <div className="overflow-hidden rounded-3xl border border-border">
            <img
              src={routeImage(data.route)}
              alt={data.route.name}
              width={1280}
              height={853}
              className="aspect-[16/10] w-full object-cover sm:aspect-[21/9]"
            />
          </div>

          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {data.route.region ?? "Kenya"}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl">{data.route.name}</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {data.route.starting_location} → {data.route.destination}
            </p>
            {data.route.description && (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
                {data.route.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/routes/$id/plan"
                params={{ id }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Plan this trip
              </Link>
              <SaveRouteButton routeId={data.route.id} />
              <ShareButton
                title={`${data.route.name} — TWENDE`}
                text={data.route.description ?? undefined}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact icon={MapPin} label="Distance" value={formatDistance(data.route.distance_km)} />
              <Fact
                icon={Clock}
                label="Drive time"
                value={formatDuration(data.route.estimated_drive_minutes)}
              />
              <Fact icon={Mountain} label="Difficulty" value={data.route.difficulty ?? "—"} />
              <Fact icon={Clock} label="Best time" value={data.route.best_time_to_visit ?? "—"} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Distances and drive times are curated estimates and will be verified against a
              mapping provider in a later phase.
            </p>
          </header>

          <section>
            <SectionHeader title="Route map" description="Coming in a later phase." />
            <MapPlaceholder label={`${data.route.starting_location} → ${data.route.destination}`} />
          </section>

          <section>
            <SectionHeader
              title="The journey"
              description={
                data.stops.length > 0
                  ? "Curated stops along the way, in driving order."
                  : undefined
              }
            />
            {data.stops.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                Curated stops for this route haven't been added yet.
              </p>
            ) : (
              <JourneyTimeline stops={data.stops} />
            )}
          </section>

          <section>
            <SectionHeader title="What to expect" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Recommended duration" value={data.route.recommended_duration} />
              <Detail label="Best time to visit" value={data.route.best_time_to_visit} />
              <Detail label="Difficulty" value={data.route.difficulty} />
              <Detail
                label="Categories"
                value={data.route.category.length > 0 ? data.route.category.join(" · ") : null}
              />
            </div>
          </section>

          <section>
            <SectionHeader title="Trip planning" description="Arriving in a later phase." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Placeholder
                icon={Fuel}
                title="Fuel estimate"
                body="Add your vehicle's fuel consumption and TWENDE will estimate litres needed for this route."
              />
              <Placeholder
                icon={Wallet}
                title="Trip budget"
                body="Fuel, stops and overnight costs will be combined into an estimated trip budget."
              />
            </div>
          </section>
        </article>
      )}
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value ?? "Not documented yet"}</p>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      <p className="mt-2 text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Placeholder({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Fuel;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5">
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
