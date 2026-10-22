import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Map } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { MapPlaceholder } from "@/components/twende/map-placeholder";
import { PageHeader } from "@/components/twende/page-header";
import { RouteCard } from "@/components/twende/route-card";
import { SectionHeader } from "@/components/twende/section-header";
import { CardGridSkeleton, ErrorState } from "@/components/twende/states";
import { routesQuery } from "@/lib/twende/queries";

const title = "Map — TWENDE";
const description =
  "An interactive Kenya road map for planning drives and finding places is on the way.";

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

function MapPage() {
  const { data, isLoading, isError, refetch } = useQuery(routesQuery);
  const featured = (data ?? []).slice(0, 6);

  return (
    <AppShell>
      <PageHeader
        title="Map"
        description="Search places, trace routes and find help along the road — the interactive map arrives with our OpenStreetMap integration in a later phase."
      />

      <MapPlaceholder label="Kenya road map" />

      <section className="mt-10">
        <SectionHeader
          title="Plan from the roads we know"
          description="Until the map is live, start from our curated Kenyan drives."
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
