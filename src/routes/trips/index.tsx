import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapPinned, LogIn } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { EmptyState } from "@/components/twende/empty-state";
import { PageHeader } from "@/components/twende/page-header";
import { TripCard } from "@/components/twende/trip-card";
import { CardSkeleton, ErrorState } from "@/components/twende/states";
import { useSession } from "@/hooks/use-session";
import { tripsQuery } from "@/lib/twende/queries";

const title = "My Trips — TWENDE";
const description = "Your personal Kenyan road-trip history, recorded trip by trip.";

export const Route = createFileRoute("/trips/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const { user, loading } = useSession();
  const { data, isLoading, isError, refetch } = useQuery(tripsQuery(user?.id ?? null));

  return (
    <AppShell>
      <PageHeader
        title="My Trips"
        description="Every road trip you record will be kept here."
      />

      {loading && <CardSkeleton />}

      {!loading && !user && (
        <EmptyState
          icon={LogIn}
          title="Sign in to keep your trips"
          description="Create an account so your road-trip history, vehicles and notes stay with you."
          action={{ label: "Sign in", to: "/auth" }}
        />
      )}

      {!loading && user && (
        <>
          {isLoading && <CardSkeleton />}
          {isError && <ErrorState onRetry={() => void refetch()} />}
          {!isLoading && !isError && (data ?? []).length === 0 && (
            <EmptyState
              icon={MapPinned}
              title="Your road trips will live here."
              description="Start exploring Kenya and your completed journeys will appear here."
              action={{ label: "Explore Routes", to: "/routes" }}
            />
          )}
          {!isLoading && !isError && (data ?? []).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(data ?? []).map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Trip recording — distance, duration, stops, photos and fuel used — arrives in a later
        phase.
      </p>
    </AppShell>
  );
}
