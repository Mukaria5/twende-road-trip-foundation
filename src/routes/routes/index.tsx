import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/twende/app-shell";
import { CategoryChip } from "@/components/twende/category-chip";
import { EmptyState } from "@/components/twende/empty-state";
import { PageHeader } from "@/components/twende/page-header";
import { RouteCard } from "@/components/twende/route-card";
import { SearchBar } from "@/components/twende/search-bar";
import { CardGridSkeleton, ErrorState } from "@/components/twende/states";
import {
  DISTANCE_FILTERS,
  DURATION_FILTERS,
  TRIP_CATEGORIES,
  matchesDistance,
  matchesDuration,
} from "@/lib/twende/categories";
import { routesQuery } from "@/lib/twende/queries";

interface RoutesSearch {
  q?: string;
  category?: string;
}

const title = "Road Trips across Kenya — TWENDE";
const description = "Find your next drive across Kenya. Filter by category, duration and distance.";

export const Route = createFileRoute("/routes/")({
  validateSearch: (search: Record<string, unknown>): RoutesSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: RoutesPage,
});

function RoutesPage() {
  const { q, category } = Route.useSearch();
  const [search, setSearch] = useState(q ?? "");
  const [activeCategory, setActiveCategory] = useState<string | null>(category ?? null);
  const [duration, setDuration] = useState<string>("any");
  const [distance, setDistance] = useState<string>("any");

  const { data, isLoading, isError, refetch } = useQuery(routesQuery);

  const term = search.trim().toLowerCase();
  const results = (data ?? []).filter((route) => {
    const haystack = [route.name, route.region, route.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (term && !haystack.includes(term)) return false;
    if (activeCategory && !route.category.includes(activeCategory)) return false;
    if (!matchesDuration(route.estimated_drive_minutes, duration)) return false;
    if (!matchesDistance(route.distance_km, distance)) return false;
    return true;
  });

  return (
    <AppShell>
      <PageHeader title="Road Trips" description="Find your next drive across Kenya." />

      <div className="space-y-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search routes or regions" />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {TRIP_CATEGORIES.map((item) => (
            <CategoryChip
              key={item}
              label={item}
              active={activeCategory === item}
              onClick={() => setActiveCategory(activeCategory === item ? null : item)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Duration"
            value={duration}
            onChange={setDuration}
            options={DURATION_FILTERS}
          />
          <FilterSelect
            label="Distance"
            value={distance}
            onChange={setDistance}
            options={DISTANCE_FILTERS}
          />
        </div>
      </div>

      <div className="mt-8">
        {isLoading && <CardGridSkeleton count={6} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && results.length === 0 && (
          <EmptyState
            icon={Compass}
            title="No routes match those filters"
            description="Try clearing a filter or searching for a different region."
          />
        )}
        {!isLoading && !isError && results.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent font-medium outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
