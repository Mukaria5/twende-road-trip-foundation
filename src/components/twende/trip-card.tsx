import { Link } from "@tanstack/react-router";
import { CalendarDays, Gauge } from "lucide-react";

import { formatDate, formatDistance, formatDuration } from "@/lib/twende/format";
import type { TripRecord } from "@/lib/twende/types";

export function TripCard({ trip }: { trip: TripRecord }) {
  return (
    <Link
      to="/trips/$id"
      params={{ id: trip.id }}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg leading-snug">{trip.title ?? "Untitled trip"}</h3>
        <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium capitalize text-accent-foreground">
          {trip.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
          {formatDate(trip.started_at ?? trip.created_at)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="size-4" strokeWidth={1.75} aria-hidden />
          {formatDistance(trip.actual_distance_km)} · {formatDuration(trip.actual_duration_minutes)}
        </span>
      </div>
    </Link>
  );
}
