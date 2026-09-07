import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { CategoryChip } from "./category-chip";
import { DestinationCard } from "./destination-card";
import { RouteCard } from "./route-card";
import { SearchBar } from "./search-bar";
import { SectionHeader } from "./section-header";
import { CardGridSkeleton, ErrorState } from "./states";
import { Wordmark } from "./wordmark";
import { TRIP_CATEGORIES } from "@/lib/twende/categories";
import { regionImages } from "@/lib/twende/images";
import { routesQuery } from "@/lib/twende/queries";

const regions = [
  { name: "Rift Valley", caption: "Escarpments and lakes", image: regionImages.naivasha },
  { name: "Mount Kenya", caption: "Highland roads", image: regionImages.nanyuki },
  { name: "The Coast", caption: "Ocean drives", image: regionImages.coast },
  { name: "Central Highlands", caption: "Tea country", image: regionImages.highlands },
  { name: "Southern Plains", caption: "Open savannah", image: regionImages.amboseli },
  { name: "Lake Country", caption: "Water and birdlife", image: regionImages.nakuru },
];

export function ExploreScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useQuery(routesQuery);

  const featured = (data ?? []).filter((route) => route.is_featured).slice(0, 6);

  function goToRoutes(category?: string) {
    void navigate({ to: "/routes", search: category ? { category } : {} });
  }

  return (
    <div className="space-y-12">
      <section>
        <Wordmark size="sm" className="text-muted-foreground md:hidden" />
        <h1 className="mt-4 text-3xl md:text-5xl">Where will the road take you?</h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
          Discover road trips, scenic drives and unforgettable places across Kenya.
        </p>

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ to: "/routes", search: search ? { q: search } : {} });
          }}
        >
          <SearchBar value={search} onChange={setSearch} />
        </form>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {TRIP_CATEGORIES.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              onClick={() => goToRoutes(category)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Featured road trips"
          description="Curated drives to get you started."
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

      <section>
        <SectionHeader
          title="Explore Kenya"
          description="Regions to build a trip around."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {regions.map((region) => (
            <DestinationCard
              key={region.name}
              name={region.name}
              caption={region.caption}
              image={region.image}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
