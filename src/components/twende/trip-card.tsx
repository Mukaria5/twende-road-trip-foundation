import { Link } from "@tanstack/react-router";
import { CalendarDays, Fuel, Gauge, MapPin } from "lucide-react";

import { formatKes, formatLitres } from "@/lib/twende/fuel";
import { formatDate, formatDistance, formatDuration } from "@/lib/twende/format";
import type { TripListItem } from "@/lib/twende/queries";

export function TripCard({ trip }: { trip: TripListItem }) {
  const isCompleted = trip.status === "completed";

  return (
    <Link
      to="/trips/$id"
      params={{ id: trip.id }}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg leading-snug">{trip.title ?? "Untitled trip"}</h3>
        <span
          className={
            isCompleted
              ? "rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium capitalize text-accent-foreground"
              : "rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium capitalize text-primary-foreground"
          }
        >
          {trip.status === "active" ? "Recording" : trip.status}
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
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
          {trip.stop_count} {trip.stop_count === 1 ? "stop" : "stops"}
        </span>
        {trip.photo_count > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-sm">{trip.photo_count} 📷</span>
          </span>
        )}
        {(trip.actual_fuel_litres != null || trip.actual_fuel_cost != null) && (
          <span className="inline-flex items-center gap-1.5">
            <Fuel className="size-4" strokeWidth={1.75} aria-hidden />
            {formatLitres(trip.actual_fuel_litres)}
            {trip.actual_fuel_cost != null ? ` · ${formatKes(trip.actual_fuel_cost)}` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
